import { Injectable, NotFoundException } from '@nestjs/common';
import { Folder } from '@prisma/client';

import { PrismaService } from '@/prisma/prisma.service';
import { toBigIntId, toOptionalBigIntId } from '@/utils';

import { CreateArcDto } from './dto/create-arc.dto';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { UpdateArcDto } from './dto/update-arc.dto';

type FolderResponse = Omit<Folder, 'id' | 'parentId' | 'projectId' | 'createdBy' | 'updatedBy'> & {
  id: string;
  parentId: string | null;
  projectId: string;
  createdBy: string | null;
  updatedBy: string | null;
};

// PhucTD #011 start
@Injectable()
export class FoldersService {
  constructor(private readonly prismaService: PrismaService) {}

  async findArcs(): Promise<FolderResponse[]> {
    const arcs = await this.prismaService.folder.findMany({
      where: { parentId: null },
      orderBy: [{ index: 'asc' }, { id: 'asc' }],
    });

    return arcs.map((arc) => this.formatFolder(arc));
  }

  async createArc(createArcDto: CreateArcDto): Promise<FolderResponse> {
    const createdBy = toOptionalBigIntId(createArcDto.createdBy, 'createdBy');
    const arc = await this.prismaService.folder.create({
      data: {
        name: createArcDto.name,
        description: createArcDto.description,
        index: createArcDto.index,
        parentId: null,
        projectId: toBigIntId(createArcDto.projectId, 'projectId'),
        createdBy,
        updatedBy: createdBy,
      },
    });

    return this.formatFolder(arc);
  }

  async findArc(id: string): Promise<FolderResponse> {
    const arcId = toBigIntId(id, 'id');
    const arc = await this.findArcOrThrow(arcId);

    return this.formatFolder(arc);
  }

  async updateArc(id: string, updateArcDto: UpdateArcDto): Promise<FolderResponse> {
    const arcId = toBigIntId(id, 'id');
    await this.findArcOrThrow(arcId);

    const arc = await this.prismaService.folder.update({
      where: { id: arcId },
      data: {
        name: updateArcDto.name,
        description: updateArcDto.description,
        index: updateArcDto.index,
        updatedBy: toOptionalBigIntId(updateArcDto.updatedBy, 'updatedBy'),
      },
    });

    return this.formatFolder(arc);
  }

  async removeArc(id: string): Promise<FolderResponse> {
    const arcId = toBigIntId(id, 'id');
    await this.findArcOrThrow(arcId);

    const arc = await this.prismaService.folder.delete({
      where: { id: arcId },
    });

    return this.formatFolder(arc);
  }

  async findChapters(arcId: string): Promise<FolderResponse[]> {
    const parentId = toBigIntId(arcId, 'folderId');
    await this.findArcOrThrow(parentId);

    const chapters = await this.prismaService.folder.findMany({
      where: { parentId },
      orderBy: [{ index: 'asc' }, { id: 'asc' }],
    });

    return chapters.map((chapter) => this.formatFolder(chapter));
  }

  async createChapter(arcId: string, createChapterDto: CreateChapterDto): Promise<FolderResponse> {
    const parentId = toBigIntId(arcId, 'folderId');
    const arc = await this.findArcOrThrow(parentId);
    const createdBy = toOptionalBigIntId(createChapterDto.createdBy, 'createdBy');

    const chapter = await this.prismaService.folder.create({
      data: {
        name: createChapterDto.name,
        description: createChapterDto.description,
        index: createChapterDto.index,
        parentId,
        projectId: arc.projectId,
        createdBy,
        updatedBy: createdBy,
      },
    });

    return this.formatFolder(chapter);
  }

  private async findArcOrThrow(id: bigint): Promise<Folder> {
    const arc = await this.prismaService.folder.findFirst({
      where: { id, parentId: null },
    });

    if (!arc) {
      throw new NotFoundException('Arc not found');
    }

    return arc;
  }

  private formatFolder(folder: Folder): FolderResponse {
    return {
      ...folder,
      id: folder.id.toString(),
      parentId: folder.parentId?.toString() ?? null,
      projectId: folder.projectId.toString(),
      createdBy: folder.createdBy?.toString() ?? null,
      updatedBy: folder.updatedBy?.toString() ?? null,
    };
  }
}
// PhucTD #011 end
