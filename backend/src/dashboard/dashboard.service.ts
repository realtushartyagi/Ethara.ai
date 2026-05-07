/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { Injectable } from '@nestjs/common';
import { Role, TaskStatus, Priority, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) { }

  /**
   * Retrieves aggregated dashboard statistics using optimized Prisma queries.
   */
  async getStats(userId: string, role: Role) {
    const now = new Date();

    const whereClause: Prisma.TaskWhereInput =
      role === Role.ADMIN
        ? {}
        : {
            OR: [{ project: { adminId: userId } }, { assignedToId: userId }],
          };

    // Run all aggregation queries in parallel
    const [
      totalTasks,
      statusGroups,
      priorityGroups,
      overdueTasks,
      recentTasks,
      assigneeStats,
    ] = await Promise.all([
      this.prisma.task.count({ where: whereClause }),

      this.prisma.task.groupBy({
        by: ['status'],
        where: whereClause,
        _count: { _all: true },
      }),

      this.prisma.task.groupBy({
        by: ['priority'],
        where: whereClause,
        _count: { _all: true },
      }),

      this.prisma.task.count({
        where: {
          ...whereClause,
          status: { not: TaskStatus.DONE },
          dueDate: { lt: now, not: null },
        },
      }),

      this.prisma.task.findMany({
        where: whereClause,
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          assignedTo: {
            select: { id: true, name: true, email: true },
          },
        },
      }),

      // Get per-user stats using groupBy (efficient — single query)
      role === Role.ADMIN
        ? this.prisma.task.groupBy({
          by: ['assignedToId', 'status'],
          where: { ...whereClause, assignedToId: { not: null } },
          _count: { _all: true },
        })
        : Promise.resolve([]),
    ]);

    // Format status counts
    const statusMap = new Map<string, number>();
    for (const g of statusGroups) {
      statusMap.set(g.status, g._count._all);
    }

    const tasksByStatus = {
      todo: statusMap.get(TaskStatus.TODO) || 0,
      inProgress: statusMap.get(TaskStatus.IN_PROGRESS) || 0,
      done: statusMap.get(TaskStatus.DONE) || 0,
    };

    // Format priority counts
    const priorityMap = new Map<string, number>();
    for (const g of priorityGroups) {
      priorityMap.set(g.priority, g._count._all);
    }

    const tasksByPriority = {
      low: priorityMap.get(Priority.LOW) || 0,
      medium: priorityMap.get(Priority.MEDIUM) || 0,
      high: priorityMap.get(Priority.HIGH) || 0,
      urgent: priorityMap.get(Priority.URGENT) || 0,
    };

    // Build per-user breakdown
    let tasksPerUser: {
      userId: string;
      userName: string;
      totalAssigned: number;
      completed: number;
      pending: number;
    }[] = [];

    if (role === Role.ADMIN && (assigneeStats as any[]).length > 0) {
      // Aggregate from groupBy result
      const userMap = new Map<string, { completed: number; pending: number }>();
      for (const row of assigneeStats as any[]) {
        const uid = row.assignedToId as string;
        if (!userMap.has(uid)) userMap.set(uid, { completed: 0, pending: 0 });
        const entry = userMap.get(uid)!;
        if (row.status === TaskStatus.DONE) {
          entry.completed += row._count._all as number;
        } else {
          entry.pending += row._count._all as number;
        }
      }

      // Fetch user names in a single query
      const userIds = [...userMap.keys()];
      const users = await this.prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true },
      });

      const nameMap = new Map(users.map((u) => [u.id, u.name]));
      tasksPerUser = userIds
        .map((uid) => {
          const stats = userMap.get(uid)!;
          return {
            userId: uid,
            userName: nameMap.get(uid) || 'Unknown',
            totalAssigned: stats.completed + stats.pending,
            completed: stats.completed,
            pending: stats.pending,
          };
        })
        .sort((a, b) => b.totalAssigned - a.totalAssigned);
    } else if (role === Role.MEMBER) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true },
      });
      tasksPerUser = [
        {
          userId,
          userName: user?.name || 'Unknown',
          totalAssigned: totalTasks,
          completed: tasksByStatus.done,
          pending: tasksByStatus.todo + tasksByStatus.inProgress,
        },
      ];
    }

    const completionRate =
      totalTasks > 0 ? Math.round((tasksByStatus.done / totalTasks) * 100) : 0;

    return {
      totalTasks,
      tasksByStatus,
      tasksByPriority,
      overdueTasks,
      tasksPerUser,
      recentTasks,
      completionRate,
    };
  }
}
