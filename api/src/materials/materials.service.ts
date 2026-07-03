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
import sizeOf from 'image-size';
import { AwsS3Service } from '../share/services/aws-s3.service';

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
      files: {
        image?: Express.Multer.File[];
        text?: Express.Multer.File[];
        source?: Express.Multer.File[];
      };
      deleteImage?: boolean;
      deleteText?: boolean;
      deleteSource?: boolean;
      userId: number;
    },
  ) {
    try {
      const old = await this.ensureMaterial(id);
      let slots = [...((old.materials as any[]) || [])];

      for (const { fileKey, deleteFlag, type } of [
        { fileKey: 'image', deleteFlag: data.deleteImage, type: 'IMAGE' },
        { fileKey: 'text',  deleteFlag: data.deleteText,  type: 'TEXT'  },
        { fileKey: 'source',deleteFlag: data.deleteSource,type: 'SOURCE'},
      ]) {
        const uploadedFile = data.files[fileKey as keyof typeof data.files]?.[0];

        if (deleteFlag) {
          slots = slots.filter((s) => s.type !== type);
        } else if (uploadedFile) {
          const ext = uploadedFile.originalname.split('.').pop();
          const key = `materials/${old.fileId}/${randomUUID()}.${ext}`;
          const url = await this.awsS3Service.uploadFile(uploadedFile, key);

          const newSlot: any = {
            url,
            originalName: uploadedFile.originalname,
            size: uploadedFile.size,
            mimeType: uploadedFile.mimetype,
            type,
          };

          if (type === 'IMAGE') {
            try {
              const dim = sizeOf(uploadedFile.buffer);
              if (dim?.width && dim?.height) {
                newSlot.width = dim.width;
                newSlot.height = dim.height;
                newSlot.ratio = Number((dim.width / dim.height).toFixed(3));
                newSlot.isThumbnail = true;
              }
            } catch (_) {}
          }

          const existingIdx = slots.findIndex((s) => s.type === type);
          if (existingIdx >= 0) {
            slots[existingIdx] = newSlot;
          } else {
            slots.push(newSlot);
          }
        }
      }

      return await this.prisma.fileMaterial.create({
        data: {
          materials: slots as Prisma.InputJsonArray,
          fileId: old.fileId,
          taskId: old.taskId,
          name: old.name,
          createdBy: data.userId,
          updatedBy: data.userId,
        },
        select: MATERIAL_SELECT,
      });
    } catch (error) {
      this.handleError(error, 'Update material fail', ERROR.SVUPDATEMATERIAL);
    }
  }

  async restoreMaterial(id: number) {
    try {
      const material = await this.ensureMaterial(id);
      
      const newerMaterials = await this.prisma.fileMaterial.findMany({
        where: {
          fileId: material.fileId,
          createdAt: { gt: material.createdAt },
        },
        select: { id: true },
      });

      if (newerMaterials.length > 0) {
        await this.prisma.fileMaterial.deleteMany({
          where: {
            id: { in: newerMaterials.map((m) => m.id) },
          },
        });
      }

      return await this.prisma.fileMaterial.findUnique({
        where: { id },
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
