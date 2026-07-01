import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ERROR } from '../share/constants/message-error';
import { randomUUID } from 'crypto';
import { AwsS3Service } from '../share/services/aws-s3.service';
import sizeOf from 'image-size';
import type { Pagination } from '../share/interfaces';

const USER_SELECT = {
  select: {
    id: true,
    email: true,
    displayName: true,
    avatarUrl: true,
  },
};

const MATERIAL_SELECT = {
  id: true,
  fileId: true,
  taskId: true,
  name: true,
  materials: true,
  createdByUser: USER_SELECT,
  updatedByUser: USER_SELECT,
  createdAt: true,
  updatedAt: true,
};

const FRAME_SELECT = {
  id: true,
  startX: true,
  startY: true,
  endX: true,
  endY: true,
  material: {
    select: {
      id: true,
      fileId: true,
    },
  },
  createdByUser: USER_SELECT,
  updatedByUser: USER_SELECT,
  createdAt: true,
  updatedAt: true,
};

@Injectable()
export class MaterialsService {
  private readonly logger = new Logger(MaterialsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly awsS3Service: AwsS3Service,
  ) {}

  async getMaterialById(id: number) {
    try {
      const material = await this.ensureMaterial(id);
      return material;
    } catch (error) {
      this.handleError(error, 'Get material fail', ERROR.SVGETMATERIAL);
    }
  }

  async updateMaterial(
    id: number,
    data: {
      materials: unknown;
      userId: number;
    },
  ) {
    try {
      await this.ensureMaterial(id);

      return await this.prisma.fileMaterial.update({
        where: { id },
        data: {
          materials: data.materials as Prisma.InputJsonValue,
          updatedBy: data.userId,
        },
        select: MATERIAL_SELECT,
      });
    } catch (error) {
      this.handleError(error, 'Update material fail', ERROR.SVUPDATEMATERIAL);
    }
  }

  async restoreMaterial(id: number, userId: number) {
    try {
      const oldMaterial = await this.ensureMaterial(id);
      
      // Creating a new version based on the old one
      return await this.prisma.fileMaterial.create({
        data: {
          materials: oldMaterial.materials as Prisma.InputJsonArray,
          fileId: oldMaterial.fileId,
          taskId: oldMaterial.taskId,
          name: oldMaterial.name,
          createdBy: userId,
          updatedBy: userId,
        },
        select: MATERIAL_SELECT,
      });
    } catch (error) {
      this.handleError(error, 'Restore material fail', ERROR.SVRESTOREMATERIAL);
    }
  }

  async deleteMaterial(id: number) {
    try {
      await this.ensureMaterial(id);
      await this.prisma.fileMaterial.delete({ where: { id } });
    } catch (error) {
      this.handleError(error, 'Delete material fail', ERROR.SVDELETEMATERIAL);
    }
  }

  async addMaterialItems(id: number, userId: number, files: Express.Multer.File[]) {
    try {
      const oldMaterial = await this.ensureMaterial(id);
      const oldMaterialsArray = (oldMaterial.materials as any[]) || [];
      let hasThumbnail = oldMaterialsArray.some((m) => m.isThumbnail);

      const newMaterialsData = await Promise.all(
        files.map(async (file) => {
          const ext = file.originalname.split('.').pop();
          const key = `materials/${oldMaterial.fileId}/${randomUUID()}.${ext}`;
          const url = await this.awsS3Service.uploadFile(file, key);

          const materialObj: any = {
            url,
            originalName: file.originalname,
            size: file.size,
            mimeType: file.mimetype,
          };

          try {
            const dimensions = sizeOf(file.buffer);
            if (dimensions && dimensions.width && dimensions.height) {
              materialObj.width = dimensions.width;
              materialObj.height = dimensions.height;
              materialObj.ratio = Number((dimensions.width / dimensions.height).toFixed(3));
              
              if (!hasThumbnail) {
                materialObj.isThumbnail = true;
                hasThumbnail = true;
              } else {
                materialObj.isThumbnail = false;
              }
            }
          } catch (e) {
            // Not an image
          }
          return materialObj;
        })
      );

      const combinedMaterials = [...oldMaterialsArray, ...newMaterialsData];

      return await this.prisma.fileMaterial.create({
        data: {
          materials: combinedMaterials as Prisma.InputJsonArray,
          fileId: oldMaterial.fileId,
          taskId: oldMaterial.taskId,
          name: oldMaterial.name,
          createdBy: userId,
          updatedBy: userId,
        },
        select: MATERIAL_SELECT,
      });
    } catch (error) {
      this.handleError(error, 'Add material items fail', ERROR.SVCREATEMATERIAL);
    }
  }

  async deleteMaterialItem(id: number, userId: number, itemIndex: number) {
    try {
      const oldMaterial = await this.ensureMaterial(id);
      const materialsArray = [...((oldMaterial.materials as any[]) || [])];

      if (itemIndex >= 0 && itemIndex < materialsArray.length) {
        const deleted = materialsArray.splice(itemIndex, 1)[0];
        // If we deleted the thumbnail, assign it to the first valid image
        if (deleted?.isThumbnail) {
          const firstImage = materialsArray.find((m) => m.width && m.height);
          if (firstImage) {
            firstImage.isThumbnail = true;
          }
        }
      }

      return await this.prisma.fileMaterial.create({
        data: {
          materials: materialsArray as Prisma.InputJsonArray,
          fileId: oldMaterial.fileId,
          taskId: oldMaterial.taskId,
          name: oldMaterial.name,
          createdBy: userId,
          updatedBy: userId,
        },
        select: MATERIAL_SELECT,
      });
    } catch (error) {
      this.handleError(error, 'Delete material item fail', ERROR.SVUPDATEMATERIAL);
    }
  }

  async setMaterialThumbnail(id: number, userId: number, itemIndex: number) {
    try {
      const oldMaterial = await this.ensureMaterial(id);
      const materialsArray = [...((oldMaterial.materials as any[]) || [])];

      if (itemIndex >= 0 && itemIndex < materialsArray.length) {
        materialsArray.forEach((m, idx) => {
          m.isThumbnail = idx === itemIndex;
        });
      }

      return await this.prisma.fileMaterial.create({
        data: {
          materials: materialsArray as Prisma.InputJsonArray,
          fileId: oldMaterial.fileId,
          taskId: oldMaterial.taskId,
          name: oldMaterial.name,
          createdBy: userId,
          updatedBy: userId,
        },
        select: MATERIAL_SELECT,
      });
    } catch (error) {
      this.handleError(error, 'Set material thumbnail fail', ERROR.SVUPDATEMATERIAL);
    }
  }

  async getMaterialFrames(
    materialId: number,
    sort?: { field: 'createdAt'; order: 'asc' | 'desc' },
    pagination?: Pagination,
  ) {
    try {
      await this.ensureMaterial(materialId);

      const where: Prisma.MaterialCommentFrameWhereInput = { materialId };
      const orderBy: Prisma.MaterialCommentFrameOrderByWithRelationInput = sort
        ? { [sort.field]: sort.order }
        : { createdAt: 'desc' };
      const { page, limit, skip } = this.buildPagination(pagination);

      const [total, frames] = await this.prisma.$transaction([
        this.prisma.materialCommentFrame.count({ where }),
        this.prisma.materialCommentFrame.findMany({
          where,
          orderBy,
          skip,
          take: limit,
          select: FRAME_SELECT,
        }),
      ]);

      return {
        frames,
        pagination: this.buildPaginationMeta(total, page, limit),
      };
    } catch (error) {
      this.handleError(error, 'Get material frames fail', 'SVGETMATERIALFRAMES');
    }
  }

  async createFrame(
    materialId: number,
    data: {
      startX: number;
      startY: number;
      endX: number;
      endY: number;
      userId: number;
    },
  ) {
    try {
      await this.ensureMaterial(materialId);

      return await this.prisma.materialCommentFrame.create({
        data: {
          startX: data.startX,
          startY: data.startY,
          endX: data.endX,
          endY: data.endY,
          materialId,
          createdBy: data.userId,
        },
        select: FRAME_SELECT,
      });
    } catch (error) {
      this.handleError(error, 'Create frame fail', 'SVCREATEFRAME');
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

  private async ensureMaterial(id: number) {
    const material = await this.prisma.fileMaterial.findUnique({
      where: { id },
      select: MATERIAL_SELECT,
    });
    if (!material) {
      throw new NotFoundException(ERROR.NFMATERIAL);
    }
    return material;
  }

  private handleError(error: unknown, logMessage: string, clientMessage: string): never {
    this.logger.error(logMessage, error instanceof Error ? error.stack : String(error));
    if (error instanceof HttpException) {
      throw error;
    }
    throw new InternalServerErrorException(clientMessage);
  }
}
