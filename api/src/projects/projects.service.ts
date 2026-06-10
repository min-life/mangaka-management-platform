import { PrismaService } from '@/prisma/prisma.service';
import { serializeBigInt } from '@/utils';
import { Injectable, InternalServerErrorException } from '@nestjs/common';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  // ChuongTV #007 start
  async createProject(createProjectInput: { companyId: bigint; createdBy: bigint; name: string }) {
    try {
      const project = await this.prisma.project.create({
        data: createProjectInput,
      });
      return serializeBigInt(project);
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Failed to create project',
      });
    }
  }

  async getProjects(getProjectsInput: { companyId: bigint }) {
    try {
      const projects = await this.prisma.project.findMany({
        where: getProjectsInput,
      });
      return projects.map(serializeBigInt);
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Failed to fetch projects',
      });
    }
  }

  async getProjectById(projectId: bigint) {
    try {
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
      });
      return serializeBigInt(project);
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Failed to fetch project',
      });
    }
  }

  async deleteProject(projectId: bigint) {
    try {
      const project = await this.prisma.project.delete({
        where: { id: projectId },
      });
      return serializeBigInt(project);
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Failed to delete project',
      });
    }
  }

  async updateProject(projectId: bigint, updateProjectInput: { name: string; updatedBy: bigint }) {
    try {
      const project = await this.prisma.project.update({
        where: { id: projectId },
        data: updateProjectInput,
      });
      return serializeBigInt(project);
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Failed to update project',
      });
    }
  }
  // ChuongTV #007 end
}
