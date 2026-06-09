import { Module } from '@nestjs/common';
import { RolesModule } from '../roles/roles.module';
import { CompaniesController } from './companies.controller';

@Module({
  imports: [RolesModule],
  controllers: [CompaniesController],
})
export class CompaniesModule {}
