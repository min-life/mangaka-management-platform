import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  create(arg0: {
    data: {
      name: string;
      code: string;
      scope: 'SYS';
      companyId: null;
      projectId: null;
      createdBy: bigint;
      updatedBy: bigint;
    };
  }) {
    throw new Error('Method not implemented.');
  }

  constructor() {
    const adapter = new PrismaPg({ connectionString: process.env['DATABASE_URL'] });
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
