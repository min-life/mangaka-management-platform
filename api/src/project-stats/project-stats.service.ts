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

const PROJECT_SELECT = {
  id: true,
  name: true,
  description: true,
  imageUrl: true,
  editorBoard: {
    select: {
      id: true,
      name: true,
      description: true,
      imageUrl: true,
      createdByUser: USER_SELECT,
      updatedByUser: USER_SELECT,
      createdAt: true,
      updatedAt: true,
    },
  },
  createdByUser: USER_SELECT,
  updatedByUser: USER_SELECT,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ProjectSelect;

const PROJECT_STAT_SELECT = {
  id: true,
  project: {
    select: PROJECT_SELECT,
  },
  year: true,
  month: true,
  views: true,
  sales: true,
  revenue: true,
  reviews: true,
  rating: true,
  updatedAt: true,
} satisfies Prisma.ProjectStatSelect;

@Injectable()
export class ProjectStatsService {
  private readonly logger = new Logger(ProjectStatsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getProjectStatById(id: number) {
    try {
      const projectStat = await this.prisma.projectStat.findUnique({
        where: { id },
        select: PROJECT_STAT_SELECT,
      });
      if (!projectStat) {
        throw new NotFoundException(ERROR.NFPROJECTSTAT);
      }
      return projectStat;
    } catch (error) {
      this.handleError(error, 'Get project stat fail', ERROR.SVGETPROJECTSTAT);
    }
  }

  async updateProjectStat(
    id: number,
    data: {
      metrics: unknown;
    },
  ) {
    try {
      await this.ensureProjectStat(id);

      return await this.prisma.projectStat.update({
        where: { id },
        data: {
          updatedAt: new Date(),
        },
        select: PROJECT_STAT_SELECT,
      });
    } catch (error) {
      this.handleError(error, 'Update project stat fail', ERROR.SVUPDATEPROJECTSTAT);
    }
  }

  async deleteProjectStat(id: number) {
    try {
      await this.ensureProjectStat(id);
      await this.prisma.projectStat.delete({ where: { id } });
    } catch (error) {
      this.handleError(error, 'Delete project stat fail', ERROR.SVDELETEPROJECTSTAT);
    }
  }

  private async ensureProjectStat(id: number) {
    const projectStat = await this.prisma.projectStat.findUnique({
      where: { id },
      select: PROJECT_STAT_SELECT,
    });
    if (!projectStat) {
      throw new NotFoundException(ERROR.NFPROJECTSTAT);
    }
    return projectStat;
  }

  private handleError(error: unknown, logMessage: string, clientMessage: string): never {
    this.logger.error(logMessage, error instanceof Error ? error.stack : String(error));
    if (error instanceof HttpException) {
      throw error;
    }
    throw new InternalServerErrorException(clientMessage);
  }
}
