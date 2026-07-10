import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { ERROR } from '../share/constants/message-error';
import type { Pagination } from '../share/interfaces';
import { AwsS3Service } from '../share/services/aws-s3.service';

const USER_SELECT = {
  select: {
    id: true,
    email: true,
    displayName: true,
    avatarUrl: true,
  },
};

const PROJECT_BASIC_SELECT = {
  id: true,
  name: true,
  imageUrl: true,
};

const PROJECT_SELECT = {
  ...PROJECT_BASIC_SELECT,
  description: true,
  editorBoard: {
    select: {
      id: true,
      name: true,
      description: true,
      imageUrl: true,
    },
  },
  createdAt: true,
  updatedAt: true,
};

export const FOLDER_LIST_SELECT = {
  id: true,
  title: true,
  description: true,
  imageUrl: true,
  createdByUser: USER_SELECT,
  updatedByUser: USER_SELECT,
  createdAt: true,
  updatedAt: true,
};

const FOLDER_SELECT = {
  ...FOLDER_LIST_SELECT,
  parent: {
    select: {
      id: true,
      title: true,
      description: true,
      imageUrl: true,
    },
  },
  project: {
    select: PROJECT_BASIC_SELECT,
  },
};

export const FILE_LIST_SELECT = {
  id: true,
  title: true,
  description: true,
  createdByUser: USER_SELECT,
  updatedByUser: USER_SELECT,
  createdAt: true,
  updatedAt: true,
};

const FILE_SELECT = {
  ...FILE_LIST_SELECT,
  folder: {
    select: {
      id: true,
      title: true,
      description: true,
      imageUrl: true,
      project: {
        select: PROJECT_BASIC_SELECT,
      },
    },
  },
};

@Injectable()
export class FoldersService {
  private readonly logger = new Logger(FoldersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly awsS3Service: AwsS3Service,
  ) {}

  async getFolderById(id: number) {
    try {
      const folder = await this.prisma.folder.findUnique({
        where: { id },
        select: FOLDER_SELECT,
      });
      if (!folder) {
        throw new NotFoundException(ERROR.NFFOLDER);
      }
      return folder;
    } catch (error) {
      this.handleError(error, 'Get folder fail', ERROR.SVGETFOLDER);
    }
  }

  async updateFolder(
    id: number,
    data: {
      title?: string;
      description?: string;
      imageUrl?: string;
      userId: number;
    },
  ) {
    try {
      await this.ensureFolder(id);

      return await this.prisma.folder.update({
        where: { id },
        data: {
          title: data.title,
          description: data.description,
          imageUrl: data.imageUrl,
          updatedBy: data.userId,
        },
        select: FOLDER_SELECT,
      });
    } catch (error) {
      this.handleError(error, 'Update folder fail', ERROR.SVUPDATEFOLDER);
    }
  }

  async uploadFolderImage(folderId: number, file: Express.Multer.File, userId: number) {
    try {
      const folder = await this.ensureFolder(folderId);

      const ext = file.originalname.split('.').pop();
      const key = `folders/${folder.projectId}/${folderId}/${randomUUID()}.${ext}`;
      const imageUrl = await this.awsS3Service.uploadFile(file, key);

      return await this.prisma.folder.update({
        where: { id: folderId },
        data: { imageUrl, updatedBy: userId },
        select: FOLDER_SELECT,
      });
    } catch (error) {
      this.handleError(error, 'Upload folder image fail', ERROR.SVUPDATEFOLDER);
    }
  }

  async deleteFolder(id: number) {
    try {
      await this.ensureFolder(id);
      await this.prisma.folder.delete({ where: { id } });
    } catch (error) {
      this.handleError(error, 'Delete folder fail', ERROR.SVDELETEFOLDER);
    }
  }

  async getFolderFiles(
    folderId: number,
    filter?: {
      search?: string;
    },
    sort?: { field: 'title' | 'createdAt'; order: 'asc' | 'desc' },
    pagination?: Pagination,
  ) {
    try {
      await this.ensureFolder(folderId);

      const where: Prisma.FileWhereInput = {
        folderId,
        ...(filter?.search && { title: { contains: filter.search, mode: 'insensitive' } }),
      };
      const orderBy: Prisma.FileOrderByWithRelationInput = sort
        ? { [sort.field]: sort.order }
        : { createdAt: 'desc' };
      const { page, limit, skip } = this.buildPagination(pagination);

      const [total, files] = await this.prisma.$transaction([
        this.prisma.file.count({ where }),
        this.prisma.file.findMany({
          where,
          orderBy,
          skip,
          take: limit,
          select: FILE_LIST_SELECT,
        }),
      ]);

      return {
        files,
        pagination: this.buildPaginationMeta(total, page, limit),
      };
    } catch (error) {
      this.handleError(error, 'Get folder files fail', ERROR.SVGETFOLDERFILES);
    }
  }

  async createFile(
    folderId: number,
    data: {
      title: string;
      description?: string;
      userId: number;
    },
  ) {
    try {
      await this.ensureFolder(folderId);

      return await this.prisma.file.create({
        data: {
          title: data.title,
          description: data.description,
          folderId,
          createdBy: data.userId,
          updatedBy: data.userId,
        },
        select: FILE_SELECT,
      });
    } catch (error) {
      this.handleError(error, 'Create file fail', ERROR.SVCREATEFILE);
    }
  }

  async getFolderChildren(
    folderId: number,
    filter?: {
      search?: string;
    },
    sort?: { field: 'title' | 'createdAt'; order: 'asc' | 'desc' },
    pagination?: Pagination,
  ) {
    try {
      await this.ensureFolder(folderId);

      const where: Prisma.FolderWhereInput = {
        parentId: folderId,
        ...(filter?.search && { title: { contains: filter.search, mode: 'insensitive' } }),
      };
      const orderBy: Prisma.FolderOrderByWithRelationInput = sort
        ? { [sort.field]: sort.order }
        : { createdAt: 'desc' };
      const { page, limit, skip } = this.buildPagination(pagination);

      const [total, children] = await this.prisma.$transaction([
        this.prisma.folder.count({ where }),
        this.prisma.folder.findMany({
          where,
          orderBy,
          skip,
          take: limit,
          select: FOLDER_LIST_SELECT,
        }),
      ]);

      return {
        folders: children,
        pagination: this.buildPaginationMeta(total, page, limit),
      };
    } catch (error) {
      this.handleError(error, 'Get folder children fail', ERROR.SVGETFOLDERCHILDREN);
    }
  }

  async createChildFolder(
    folderId: number,
    data: {
      title: string;
      description?: string;
      imageUrl?: string;
      userId: number;
    },
  ) {
    try {
      const parentFolder = await this.ensureFolder(folderId);
      if (parentFolder.parentId !== null) {
        throw new BadRequestException('Cannot create a subfolder under a Chapter (maximum depth is 2)');
      }

      return await this.prisma.folder.create({
        data: {
          title: data.title,
          description: data.description,
          imageUrl: data.imageUrl,
          parentId: folderId,
          projectId: parentFolder.projectId,
          createdBy: data.userId,
        },
        select: FOLDER_SELECT,
      });
    } catch (error) {
      this.handleError(error, 'Create child folder fail', ERROR.SVCREATECHILDFOLDER);
    }
  }

  private buildPagination(pagination?: Pagination) {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    return {
      page,
      limit,
      skip: (page - 1) * limit,
    };
  }

  private buildPaginationMeta(total: number, page: number, limit: number) {
    return {
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  private async ensureFolder(id: number) {
    const folder = await this.prisma.folder.findUnique({ where: { id } });
    if (!folder) {
      throw new NotFoundException(ERROR.NFFOLDER);
    }
    return folder;
  }

  private handleError(error: unknown, logMessage: string, clientMessage: string): never {
    this.logger.error(logMessage, error instanceof Error ? error.stack : String(error));
    if (error instanceof HttpException) {
      throw error;
    }
    throw new InternalServerErrorException(clientMessage);
  }
}
