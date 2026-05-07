import { PrismaClient, Role, Priority, TaskStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // 1. Create an admin user
  const adminPassword = await bcrypt.hash('password123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'System Admin',
      password: adminPassword,
      role: Role.ADMIN,
    },
  });
  console.log(`Created admin user: ${admin.email}`);

  // 2. Create a standard member user
  const memberPassword = await bcrypt.hash('password123', 10);
  const member = await prisma.user.upsert({
    where: { email: 'member@example.com' },
    update: {},
    create: {
      email: 'member@example.com',
      name: 'Team Member',
      password: memberPassword,
      role: Role.MEMBER,
    },
  });
  console.log(`Created member user: ${member.email}`);

  // 3. Create a sample project
  const project = await prisma.project.upsert({
    where: { id: 'seed-project-1' }, // Upsert by a known ID if we want, but better to check by name if possible, or just create it
    update: {},
    create: {
      name: 'Website Redesign',
      description: 'Overhaul the corporate website with a modern look and feel.',
      adminId: admin.id,
      members: {
        create: [
          { userId: admin.id },
          { userId: member.id },
        ],
      },
      tasks: {
        create: [
          {
            title: 'Design Mockups',
            description: 'Create Figma designs for homepage.',
            priority: Priority.HIGH,
            status: TaskStatus.DONE,
            dueDate: new Date(Date.now() - 86400000), // yesterday
            createdById: admin.id,
            assignedToId: member.id,
          },
          {
            title: 'Setup NextJS Repo',
            description: 'Initialize the frontend application.',
            priority: Priority.URGENT,
            status: TaskStatus.IN_PROGRESS,
            dueDate: new Date(Date.now() + 86400000), // tomorrow
            createdById: admin.id,
            assignedToId: member.id,
          },
          {
            title: 'Database Schema',
            description: 'Design the database schema for the new features.',
            priority: Priority.MEDIUM,
            status: TaskStatus.TODO,
            dueDate: new Date(Date.now() + 86400000 * 5), // 5 days from now
            createdById: admin.id,
          },
        ],
      },
    },
  });
  console.log(`Created sample project: "${project.name}" with tasks`);

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
