import { Injectable, NotFoundException } from '@nestjs/common';
import { File } from '@prisma/client';

import { PrismaService } from '@/prisma/prisma.service';
import { toBigIntId, toOptionalBigIntId } from '@/utils';

import { CreateFileDto } from './dto/create-file.dto';
import { UpdateFileDto } from './dto/update-file.dto';

type PageResponse = Omit<File, 'id' | 'folderId' | 'createdBy' | 'updatedBy'> & {
  id: string;
  folderId: string;
  createdBy: string | null;
  updatedBy: string | null;
};

// PhucTD #011 start
@Injectable()
export class FilesService {
  constructor(private readonly prismaService: PrismaService) {}

  async findPages(chapterId: string): Promise<PageResponse[]> {
    const chapterFolderId = toBigIntId(chapterId, 'folderId');
    await this.findChapterOrThrow(chapterFolderId);

    const pages = await this.prismaService.file.findMany({
      where: { folderId: chapterFolderId },
      orderBy: [{ index: 'asc' }, { id: 'asc' }],
    });

    return pages.map((page) => this.formatPage(page));
  }

  async createPage(chapterId: string, createFileDto: CreateFileDto): Promise<PageResponse> {
    const chapterFolderId = toBigIntId(chapterId, 'folderId');
    await this.findChapterOrThrow(chapterFolderId);

    const createdBy = toOptionalBigIntId(createFileDto.createdBy, 'createdBy');
    const page = await this.prismaService.file.create({
      data: {
        name: createFileDto.name,
        index: createFileDto.index,
        folderId: chapterFolderId,
        createdBy,
        updatedBy: createdBy,
      },
    });

    return this.formatPage(page);
  }

  async findPage(id: string): Promise<PageResponse> {
    const pageId = toBigIntId(id, 'id');
    const page = await this.findPageOrThrow(pageId);

    return this.formatPage(page);
  }

  async updatePage(id: string, updateFileDto: UpdateFileDto): Promise<PageResponse> {
    const pageId = toBigIntId(id, 'id');
    await this.findPageOrThrow(pageId);

    const page = await this.prismaService.file.update({
      where: { id: pageId },
      data: {
        name: updateFileDto.name,
        index: updateFileDto.index,
        updatedBy: toOptionalBigIntId(updateFileDto.updatedBy, 'updatedBy'),
      },
    });

    return this.formatPage(page);
  }

  async removePage(id: string): Promise<PageResponse> {
    const pageId = toBigIntId(id, 'id');
    await this.findPageOrThrow(pageId);

    const page = await this.prismaService.file.delete({
      where: { id: pageId },
    });

    return this.formatPage(page);
  }

  private async findChapterOrThrow(id: bigint) {
    const chapter = await this.prismaService.folder.findFirst({
      where: { id, parentId: { not: null } },
    });

    if (!chapter) {
      throw new NotFoundException('Chapter not found');
    }

    return chapter;
  }

  private async findPageOrThrow(id: bigint): Promise<File> {
    const page = await this.prismaService.file.findUnique({
      where: { id },
    });

    if (!page) {
      throw new NotFoundException('Page not found');
    }

    return page;
  }

  private formatPage(page: File): PageResponse {
    return {
      ...page,
      id: page.id.toString(),
      folderId: page.folderId.toString(),
      createdBy: page.createdBy?.toString() ?? null,
      updatedBy: page.updatedBy?.toString() ?? null,
    };
  }
}
// PhucTD #011 end
