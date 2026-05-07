import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { FilterTasksDto } from './dto/filter-tasks.dto';

const ASSIGNEE_SELECT = {
  select: { id: true, name: true, email: true },
} as const;

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Creates a new task within a project. Only allowed for project admins.
   */
  async create(dto: CreateTaskDto, createdById: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: dto.projectId },
    });

    if (!project) throw new NotFoundException('Project not found');

    const isProjectAdmin = project.adminId === createdById;
    const isGlobalAdmin = (await this.prisma.user.findUnique({ where: { id: createdById } }))?.role === Role.ADMIN;

    if (!isProjectAdmin && !isGlobalAdmin) {
      throw new ForbiddenException('Only project admins can create tasks');
    }

    if (dto.assignedToId) {
      const member = await this.prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: dto.projectId,
            userId: dto.assignedToId,
          },
        },
      });

      if (!member) {
        throw new ForbiddenException('Assigned user must be a project member');
      }
    }

    this.logger.log(`Task "${dto.title}" created in project ${dto.projectId}`);

    return this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        priority: dto.priority,
        status: dto.status,
        dueDate: dto.dueDate,
        projectId: dto.projectId,
        createdById,
        assignedToId: dto.assignedToId,
      },
      include: { assignedTo: ASSIGNEE_SELECT },
    });
  }

  /**
   * Finds tasks with filtering, sorting, and pagination.
   */
  async findAll(filters: FilterTasksDto, userId: string, role: Role) {
    const {
      page,
      limit,
      projectId,
      status,
      priority,
      assignedToId,
      sortBy,
      order,
    } = filters;
    const skip = (page - 1) * limit;

    // Build dynamic where clause — role-based visibility
    const accessFilter: Prisma.TaskWhereInput =
      role === Role.ADMIN
        ? {} // Global Admin sees everything
        : {
            OR: [
              { project: { adminId: userId } }, // I'm the project admin
              { assignedToId: userId }, // The task is assigned to me
            ],
          };

    const where: Prisma.TaskWhereInput = { ...accessFilter };
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assignedToId) where.assignedToId = assignedToId;

    // Whitelist sortable fields
    const allowedSortFields = [
      'createdAt',
      'updatedAt',
      'dueDate',
      'priority',
      'status',
      'title',
    ];
    const sortField = allowedSortFields.includes(sortBy || '')
      ? sortBy!
      : 'createdAt';

    const [data, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortField]: order || 'desc' },
        include: { 
          assignedTo: ASSIGNEE_SELECT,
          project: { select: { id: true, name: true, adminId: true } }
        },
      }),
      this.prisma.task.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Finds a specific task. User must have access to the project.
   */
  async findOne(taskId: string, userId: string, role: Role) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignedTo: ASSIGNEE_SELECT,
        project: { include: { members: true } },
      },
    });

    if (!task) throw new NotFoundException('Task not found');

    if (role === Role.ADMIN) return task;

    const isProjectAdmin = task.project.adminId === userId;
    const isAssignee = task.assignedToId === userId;

    if (!isProjectAdmin && !isAssignee) {
      throw new ForbiddenException('Access denied to this task');
    }

    return task;
  }

  /**
   * Updates a task.
   * Admins can update any field. Members can only update status of their assigned tasks.
   */
  async update(taskId: string, dto: UpdateTaskDto, requestingUserId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true },
    });

    if (!task) throw new NotFoundException('Task not found');

    const isProjectAdmin = task.project.adminId === requestingUserId;
    const isGlobalAdmin = (await this.prisma.user.findUnique({ where: { id: requestingUserId } }))?.role === Role.ADMIN;

    if (isProjectAdmin || isGlobalAdmin) {
      this.logger.log(`Task ${taskId} updated by admin/global-admin ${requestingUserId}`);
      return this.prisma.task.update({
        where: { id: taskId },
        data: dto,
        include: { assignedTo: ASSIGNEE_SELECT },
      });
    }

    if (task.assignedToId !== requestingUserId) {
      throw new ForbiddenException('You can only update tasks assigned to you');
    }

    if (!dto.status) {
      throw new ForbiddenException('Members can only update the task status');
    }

    this.logger.log(
      `Task ${taskId} status updated to ${dto.status} by member ${requestingUserId}`,
    );

    return this.prisma.task.update({
      where: { id: taskId },
      data: { status: dto.status },
      include: { assignedTo: ASSIGNEE_SELECT },
    });
  }

  /**
   * Deletes a task. Only allowed for project admins.
   */
  async delete(taskId: string, requestingUserId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true },
    });

    if (!task) throw new NotFoundException('Task not found');

    const isProjectAdmin = task.project.adminId === requestingUserId;
    const isGlobalAdmin = (await this.prisma.user.findUnique({ where: { id: requestingUserId } }))?.role === Role.ADMIN;

    if (!isProjectAdmin && !isGlobalAdmin) {
      throw new ForbiddenException('Only project admins can delete tasks');
    }

    this.logger.log(`Task ${taskId} deleted by admin ${requestingUserId}`);

    return this.prisma.task.delete({
      where: { id: taskId },
    });
  }
}
