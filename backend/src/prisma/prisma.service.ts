import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Service responsible for managing the Prisma database connection.
 * Extends the PrismaClient to provide database access methods.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  /**
   * Initializes the database connection when the module starts.
   */
  async onModuleInit() {
    await this.$connect();
  }

  /**
   * Closes the database connection when the module is destroyed.
   */
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
