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
  materials: true,
  createdByUser: USER_SELECT,
  updatedByUser: USER_SELECT,
  createdAt: true,
  updatedAt: true,
};

@Injectable()
export class MaterialsService {
  private readonly logger = new Logger(MaterialsService.name);

  constructor(private readonly prisma: PrismaService) {}

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
          materials: oldMaterial.materials as Prisma.InputJsonValue,
          fileId: oldMaterial.fileId,
          createdBy: userId,
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
