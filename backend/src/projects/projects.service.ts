import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AddMemberDto } from './dto/add-member.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Creates a new project and adds the creator as the first member.
   */
  async create(dto: CreateProjectDto, adminId: string) {
    const project = await this.prisma.$transaction(async (tx) => {
      const created = await tx.project.create({
        data: {
          name: dto.name,
          description: dto.description,
          status: dto.status,
          dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
          adminId,
        },
      });

      await tx.projectMember.create({
        data: {
          projectId: created.id,
          userId: adminId,
        },
      });

      return tx.project.findUnique({
        where: { id: created.id },
        include: {
          members: {
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
            },
          },
        },
      });
    });

    this.logger.log(`Project "${dto.name}" created by user ${adminId}`);
    return project;
  }

  /**
   * Finds all projects for a user with pagination.
   */
  async findAllForUser(userId: string, role: Role, pagination: PaginationDto) {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const where =
      role === Role.ADMIN
        ? {} // Global Admin sees everything
        : { members: { some: { userId } } };

    const [data, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          updatedAt: true,
          adminId: true,
          members: {
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
            },
          },
          _count: {
            select: { tasks: true },
          },
        },
      }),
      this.prisma.project.count({ where }),
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
   * Finds a specific project with detailed info, checking access first.
   */
  async findOne(projectId: string, userId: string, role?: Role) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const isMember = project.members.some((m) => m.userId === userId);
    const isProjectAdmin = project.adminId === userId;
    const isGlobalAdmin = role === Role.ADMIN;

    this.logger.debug(`Access check for project ${projectId}: userId=${userId}, role=${role}, isMember=${isMember}, isProjectAdmin=${isProjectAdmin}, isGlobalAdmin=${isGlobalAdmin}`);

    if (!isMember && !isProjectAdmin && !isGlobalAdmin) {
      throw new ForbiddenException('Access denied to this project');
    }

    return project;
  }

  /**
   * Adds a member to a project. Only allowed for project admin.
   */
  async addMember(
    projectId: string,
    dto: AddMemberDto,
    requestingUserId: string,
  ) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) throw new NotFoundException('Project not found');
    if (project.adminId !== requestingUserId) {
      throw new ForbiddenException('Only project admins can add members');
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });

    if (!targetUser) throw new NotFoundException('User to add not found');

    const existingMember = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId: dto.userId },
      },
    });

    if (existingMember) throw new ConflictException('User is already a member');

    this.logger.log(`Member ${dto.userId} added to project ${projectId}`);

    return this.prisma.projectMember.create({
      data: { projectId, userId: dto.userId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  /**
   * Removes a member from a project. Only allowed for project admin.
   */
  async removeMember(
    projectId: string,
    memberUserId: string,
    requestingUserId: string,
  ) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) throw new NotFoundException('Project not found');

    const isProjectAdmin = project.adminId === requestingUserId;
    const isGlobalAdmin = (await this.prisma.user.findUnique({ where: { id: requestingUserId } }))?.role === Role.ADMIN;

    if (!isProjectAdmin && !isGlobalAdmin) {
      throw new ForbiddenException('Only project admins can remove members');
    }

    if (memberUserId === project.adminId) {
      throw new ConflictException('Cannot remove the project admin');
    }

    const member = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId: memberUserId },
      },
    });

    if (!member)
      throw new NotFoundException('Member not found in this project');

    this.logger.log(`Member ${memberUserId} removed from project ${projectId}`);

    return this.prisma.projectMember.delete({
      where: {
        projectId_userId: { projectId, userId: memberUserId },
      },
    });
  }

  /**
   * Updates a project. Only allowed for project admin or global admin.
   */
  async update(projectId: string, dto: UpdateProjectDto, userId: string, role?: Role) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) throw new NotFoundException('Project not found');

    const isProjectAdmin = project.adminId === userId;
    const isGlobalAdmin = role === Role.ADMIN;

    if (!isProjectAdmin && !isGlobalAdmin) {
      throw new ForbiddenException('Only project admins can update projects');
    }

    this.logger.log(`Project ${projectId} updated by ${isGlobalAdmin ? 'Global Admin' : 'Project Admin'} ${userId}`);

    return this.prisma.project.update({
      where: { id: projectId },
      data: {
        ...dto,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
    });
  }

  /**
   * Deletes a project. Only allowed for project admin.
   */
  async delete(projectId: string, userId: string, role?: Role) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) throw new NotFoundException('Project not found');
    
    const isProjectAdmin = project.adminId === userId;
    const isGlobalAdmin = role === Role.ADMIN;

    if (!isProjectAdmin && !isGlobalAdmin) {
      throw new ForbiddenException('Only project admins can delete projects');
    }

    this.logger.log(`Project ${projectId} deleted by ${isGlobalAdmin ? 'Global Admin' : 'Project Admin'} ${userId}`);

    return this.prisma.project.delete({
      where: { id: projectId },
    });
  }
}
