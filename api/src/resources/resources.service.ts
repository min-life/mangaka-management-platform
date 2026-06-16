import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ResourcesService {
  constructor(private readonly prisma: PrismaService) {}

  editorBoards = this.crud('editorBoard', 'Editor board', 'both');
  folders = this.crud('folder', 'Folder', 'both');
  files = this.crud('file', 'File', 'both');
  fileMaterials = this.crud('fileMaterial', 'File material', 'both');
  tasks = this.crud('task', 'Task', 'both');
  taskCommentFrames = this.crud('taskCommentFrame', 'Task comment frame', 'both');
  taskComments = this.crud('taskComment', 'Task comment', 'createdOnly');
  applications = this.crud('application', 'Application', 'both');
  projectStats = this.crud('projectStat', 'Project stat', 'none');

  async assignEditorBoardUser(editorBoardId: number, userId: number, isLead = false) {
    await this.editorBoards.findOne(editorBoardId);

    await this.prisma.userEditorBoard.upsert({
      where: { userId_editorBoardId: { userId, editorBoardId } },
      update: { isLead },
      create: { userId, editorBoardId, isLead },
    });

    return { data: { success: true } };
  }

  async removeEditorBoardUser(editorBoardId: number, userId: number) {
    await this.prisma.userEditorBoard.deleteMany({ where: { editorBoardId, userId } });
    return { data: { success: true } };
  }

  private crud(delegateName: string, label: string, audit: 'both' | 'createdOnly' | 'none') {
    const prisma = this.prisma as any;
    const delegate = prisma[delegateName];

    return {
      findAll: async () => {
        const rows = await delegate.findMany({ orderBy: { id: 'asc' } });
        return { data: rows };
      },
      findOne: async (id: number) => {
        const row = await delegate.findUnique({ where: { id } });

        if (!row) {
          throw new NotFoundException(`${label} not found`);
        }

        return { data: row };
      },
      create: async (data: any, currentUserId?: number) => {
        const row = await delegate.create({
          data: this.withCreateAudit(data, currentUserId, audit),
        });

        return { data: row };
      },
      update: async (id: number, data: any, currentUserId?: number) => {
        await this.ensureExists(delegate, id, label);

        const row = await delegate.update({
          where: { id },
          data: this.withUpdateAudit(data, currentUserId, audit),
        });

        return { data: row };
      },
      delete: async (id: number) => {
        await this.ensureExists(delegate, id, label);
        await delegate.delete({ where: { id } });
        return { data: { success: true } };
      },
    };
  }

  private async ensureExists(delegate: any, id: number, label: string) {
    const row = await delegate.findUnique({ where: { id } });

    if (!row) {
      throw new NotFoundException(`${label} not found`);
    }

    return row;
  }

  private withCreateAudit(data: any, currentUserId: number | undefined, audit: string) {
    if (audit === 'none') {
      return data;
    }

    if (audit === 'createdOnly') {
      return {
        ...data,
        createdBy: currentUserId ?? data.createdBy,
      };
    }

    return {
      ...data,
      createdBy: currentUserId ?? data.createdBy,
      updatedBy: currentUserId ?? data.updatedBy,
    };
  }

  private withUpdateAudit(data: any, currentUserId: number | undefined, audit: string) {
    if (audit !== 'both') {
      return data;
    }

    return {
      ...data,
      updatedBy: currentUserId ?? data.updatedBy,
    };
  }
}
