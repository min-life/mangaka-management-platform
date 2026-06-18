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

@Injectable()
export class MaterialsService {
  private readonly logger = new Logger(MaterialsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getMaterialById(id: number) {
    try {
      return await this.ensureMaterial(id);
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
      });
    } catch (error) {
      this.handleError(error, 'Update material fail', ERROR.SVUPDATEMATERIAL);
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
    const material = await this.prisma.fileMaterial.findUnique({ where: { id } });
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
