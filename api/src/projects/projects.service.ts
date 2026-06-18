import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async createProject(data: {
    name: string;
    editorBoardId?: number | null;
    createdBy?: number;
  }) {
    const project = await this.prisma.project.create({
      data: {
        name: data.name,
        editorBoardId: data.editorBoardId,
        createdBy: data.createdBy,
        updatedBy: data.createdBy,
      },
    });

    return { data: project };
  }

  async getProjects() {
    const projects = await this.prisma.project.findMany({ orderBy: { id: 'asc' } });
    return { data: projects };
  }

  async getProjectById(projectId: number) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return { data: project };
  }

  async deleteProject(projectId: number) {
    await this.getProjectById(projectId);
    await this.prisma.project.delete({ where: { id: projectId } });
    return { data: { success: true } };
  }

  async updateProject(
    projectId: number,
    data: { name?: string; editorBoardId?: number | null; updatedBy?: number },
  ) {
    await this.getProjectById(projectId);

    const project = await this.prisma.project.update({
      where: { id: projectId },
      data,
    });

    return { data: project };
  }

  async assignUser(projectId: number, userId: number, roleId: number, actorId?: number) {
    await this.getProjectById(projectId);

    await this.prisma.userProject.upsert({
      where: { userId_projectId_roleId: { userId, projectId, roleId } },
      update: { updatedBy: actorId },
      create: { userId, projectId, roleId, createdBy: actorId, updatedBy: actorId },
    });

    return { data: { success: true } };
  }

  async removeUser(projectId: number, userId: number, roleId: number) {
    await this.prisma.userProject.deleteMany({ where: { userId, projectId, roleId } });
    return { data: { success: true } };
  }
}
