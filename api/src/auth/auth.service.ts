import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { GoogleOAuthProfile, Resource } from './interfaces';
import { ERROR } from '@/constants/message-error';
import { ResourceScope } from './interfaces/resource-scope.interface';

const REFRESH_TOKEN_EXPIRES_IN_DAYS = Number(process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS ?? 7);
const REFRESH_TOKEN_EXPIRES_IN_MS = REFRESH_TOKEN_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000;
const DEFAULT_ACCESS_TOKEN_TTL = '15m';
const DEFAULT_REFRESH_TOKEN_TTL = '7d';
const EMAIL_VERIFICATION_TOKEN_EXPIRES_IN_HOURS = Number(
  process.env.EMAIL_VERIFICATION_TOKEN_EXPIRES_IN_HOURS ?? 24,
);
const EMAIL_VERIFICATION_TOKEN_EXPIRES_IN_MS =
  EMAIL_VERIFICATION_TOKEN_EXPIRES_IN_HOURS * 60 * 60 * 1000;
const BCRYPT_SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS ?? 10);

const GOOGLE_EMAIL_EXISTS_ERROR = 'GOOGLE_EMAIL_EXISTS';

type RefreshRequestUser = {
  userId: string | bigint;
  email: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  // KietDM #001
  async login(body: LoginDto) {
    const email = body.email.trim().toLowerCase();
    const user = await this.prisma.user.findFirst({
      where: {
        email,
        isDeleted: false,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.password) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(body.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.emailVerifiedAt) {
      throw new UnauthorizedException('Please verify your email before logging in');
    }

    const accessToken = await this.jwtService.signAsync(
      {
        userId: user.id.toString(),
        email: user.email,
      },
      {
        secret: process.env.ACCESS_TOKEN_SECRET || 'vungoimora',
        expiresIn: REFRESH_TOKEN_EXPIRES_IN_MS,
      },
    );

    const refreshToken = this.generateRefreshToken(user.id, user.email);
    const refreshTokenExpiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN_MS);

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: refreshTokenExpiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      refreshTokenExpiresAt,
    };
  }

  // KietDM #001
  async loginWithGoogle(profile: GoogleOAuthProfile) {
    if (!profile.email || !profile.emailVerified) {
      throw new UnauthorizedException('Google account must have a verified email');
    }

    const { user, isNewUser } = await this.prisma.$transaction(async (prisma) => {
      const googleUser = await prisma.user.findUnique({
        where: {
          googleId: profile.providerAccountId,
        },
      });

      if (googleUser) {
        if (googleUser.isDeleted) {
          throw new UnauthorizedException('Account is not available');
        }

        const updatedUser = await prisma.user.update({
          where: {
            id: googleUser.id,
          },
          data: {
            avatarUrl: profile.avatarUrl ?? googleUser.avatarUrl,
            emailVerifiedAt: googleUser.emailVerifiedAt ?? new Date(),
            emailVerificationTokenHash: null,
            emailVerificationTokenExpiresAt: null,
          },
        });

        return {
          user: updatedUser,
          isNewUser: false,
        };
      }

      const existingUser = await prisma.user.findUnique({
        where: {
          email: profile.email,
        },
      });

      if (existingUser) {
        if (existingUser.isDeleted) {
          throw new UnauthorizedException('Account is not available');
        }

        throw new ConflictException(GOOGLE_EMAIL_EXISTS_ERROR);
      }

      const createdUser = await prisma.user.create({
        data: {
          email: profile.email,
          googleId: profile.providerAccountId,
          password: null,
          displayName: null,
          avatarUrl: profile.avatarUrl,
          emailVerifiedAt: new Date(),
        },
      });

      return {
        user: createdUser,
        isNewUser: true,
      };
    });

    const accessToken = this.jwtService.sign({
      userId: user.id.toString(),
      email: user.email,
    });

    const refreshToken = this.generateRefreshToken(user.id, user.email);
    const refreshTokenExpiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN_MS);

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: refreshTokenExpiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      refreshTokenExpiresAt,
      requiresProfileCompletion: isNewUser || !user.displayName,
    };
  }

  // KietDM #001
  async logout(refreshToken?: string, authorization?: string): Promise<void> {
    const accessToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];

    if (accessToken) {
      const payload = this.jwtService.decode(accessToken) as { exp?: number } | null;

      if (payload?.exp) {
        await this.prisma.blacklistToken.create({
          data: {
            token: accessToken,
            expiresAt: new Date(payload.exp * 1000),
          },
        });
      }
    }

    if (!refreshToken) {
      return;
    }

    await this.prisma.refreshToken.deleteMany({
      where: {
        token: refreshToken,
      },
    });
  }

  // KietDM #001
  async register(body: RegisterDto) {
    const email = body.email.trim().toLowerCase();
    const hashedPassword = await bcrypt.hash(body.password, BCRYPT_SALT_ROUNDS);
    const verificationToken = randomBytes(64).toString('hex');
    const verificationTokenExpiresAt = new Date(
      Date.now() + EMAIL_VERIFICATION_TOKEN_EXPIRES_IN_MS,
    );

    const user = await this.prisma.$transaction(async (prisma) => {
      const existingUser = await prisma.user.findUnique({
        where: {
          email,
        },
      });

      if (existingUser) {
        throw new ConflictException('Email already exists');
      }

      const createdUser = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          displayName: body.displayName.trim(),
          emailVerifiedAt: null,
          emailVerificationTokenHash: this.hashEmailVerificationToken(verificationToken),
          emailVerificationTokenExpiresAt: verificationTokenExpiresAt,
        },
      });

      return createdUser;
    });

    await this.mailService.sendVerificationEmail(email, verificationToken);

    return {
      user,
    };
  }

  // KietDM #001
  async verifyEmail(body: VerifyEmailDto) {
    const token = body.token.trim();
    const user = await this.prisma.user.findUnique({
      where: {
        emailVerificationTokenHash: token,
      },
    });

    if (!user || !user.emailVerificationTokenExpiresAt) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        emailVerifiedAt: new Date(),
        emailVerificationTokenHash: null,
        emailVerificationTokenExpiresAt: null,
      },
    });
  }

  // KietDM #001
  async refresh(oldRefreshToken: string, user: RefreshRequestUser) {
    const userId = user.userId.toString();
    const accessToken = this.generateAccessToken(userId, user.email);
    const refreshToken = this.generateRefreshToken(userId, user.email);
    const refreshTokenExpiresAt = this.getRefreshTokenExpiresAt();

    await this.prisma.$transaction(async (prisma) => {
      const deletedRefreshToken = await prisma.refreshToken.deleteMany({
        where: {
          token: oldRefreshToken,
          userId: BigInt(userId),
        },
      });

      if (deletedRefreshToken.count === 0) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: BigInt(userId),
          expiresAt: refreshTokenExpiresAt,
        },
      });
    });

    return {
      accessToken,
      refreshToken,
      refreshTokenExpiresAt,
    };
  }

  private hashEmailVerificationToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private generateAccessToken(userId: string, email: string): string {
    return this.jwtService.sign(
      {
        userId,
        email,
      },
      {
        secret: process.env.ACCESS_TOKEN_SECRET ?? 'default',
        expiresIn: this.getJwtExpiresIn(process.env.ACCESS_TOKEN_TTL ?? DEFAULT_ACCESS_TOKEN_TTL),
      },
    );
  }

  private generateRefreshToken(userId: bigint | string, email: string): string {
    return this.jwtService.sign(
      {
        userId: userId.toString(),
        email,
      },
      {
        secret: process.env.REFRESH_TOKEN_SECRET ?? 'default',
        expiresIn: this.getJwtExpiresIn(
          process.env.REFRESH_TOKEN_TTL ?? `${REFRESH_TOKEN_EXPIRES_IN_DAYS}d`,
        ),
      },
    );
  }

  private getRefreshTokenExpiresAt(): Date {
    return new Date(
      Date.now() + this.parseJwtTtlToMs(process.env.REFRESH_TOKEN_TTL ?? DEFAULT_REFRESH_TOKEN_TTL),
    );
  }

  private getJwtExpiresIn(ttl: string): JwtSignOptions['expiresIn'] {
    return ttl as JwtSignOptions['expiresIn'];
  }

  private parseJwtTtlToMs(ttl: string): number {
    const match = ttl.trim().match(/^(\d+)(ms|s|m|h|d)?$/);

    if (!match) {
      return REFRESH_TOKEN_EXPIRES_IN_MS;
    }

    const value = Number(match[1]);
    const unit = match[2] ?? 's';

    switch (unit) {
      case 'ms':
        return value;
      case 's':
        return value * 1000;
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      default:
        return REFRESH_TOKEN_EXPIRES_IN_MS;
    }
  }

  async resourceResolver(resource: Resource, resourceId: bigint) {
    let resourceScope: ResourceScope | null | NotFoundException = null;
    switch (resource) {
      case 'FOLDER':
        resourceScope = await this.folderResolver(resourceId);
        break;
      case 'FILE':
        resourceScope = await this.fileResolver(resourceId);
        break;
      case 'TASK':
        resourceScope = await this.taskResolver(resourceId);
        break;
      case 'FRAME':
        resourceScope = await this.frameResolver(resourceId);
        break;
      case 'COMMENT':
        resourceScope = await this.commentResolver(resourceId);
        break;
      case 'ROLE':
        resourceScope = await this.roleResolver(resourceId);
        break;
      case 'PROJECT':
        resourceScope = await this.projectResolver(resourceId);
        break;
      case 'COMPANY':
        resourceScope = await this.companyResolver(resourceId);
        break;
    }
    return resourceScope;
  }

  private async folderResolver(resourceId: bigint) {
    const resource = await this.prisma.folder.findUnique({
      where: {
        id: resourceId,
      },
      select: {
        projectId: true,
      },
    });
    if (!resource) {
      return new NotFoundException(ERROR.NFFOLDER);
    }
    return {
      companyId: undefined,
      projectId: resource.projectId,
    } as ResourceScope | null;
  }

  private async fileResolver(resourceId: bigint) {
    const resource = await this.prisma.file.findUnique({
      where: {
        id: resourceId,
      },
      select: {
        folder: {
          select: {
            projectId: true,
          },
        },
      },
    });
    if (!resource) {
      return new NotFoundException(ERROR.NFFILE);
    }
    return {
      companyId: undefined,
      projectId: resource.folder.projectId,
    } as ResourceScope | null;
  }

  private async taskResolver(resourceId: bigint) {
    const resource = await this.prisma.task.findUnique({
      where: {
        id: resourceId,
      },
      select: {
        file: {
          select: {
            folder: {
              select: {
                projectId: true,
              },
            },
          },
        },
      },
    });
    if (!resource) {
      return new NotFoundException(ERROR.NFTASK);
    }
    return {
      companyId: undefined,
      projectId: resource.file.folder.projectId,
    } as ResourceScope | null;
  }

  private async frameResolver(resourceId: bigint) {
    const resource = await this.prisma.taskCommentFrame.findUnique({
      where: {
        id: resourceId,
      },
      select: {
        task: {
          select: {
            file: {
              select: {
                folder: {
                  select: {
                    projectId: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!resource) {
      return new NotFoundException(ERROR.NFFRAME);
    }
    return {
      companyId: undefined,
      projectId: resource.task.file.folder.projectId,
    } as ResourceScope | null;
  }

  private async commentResolver(resourceId: bigint) {
    const resource = await this.prisma.taskComment.findUnique({
      where: {
        id: resourceId,
      },
      select: {
        frame: {
          select: {
            task: {
              select: {
                file: {
                  select: {
                    folder: {
                      select: {
                        projectId: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!resource) {
      return new NotFoundException(ERROR.NFCOMMENT);
    }
    return {
      companyId: undefined,
      projectId: resource.frame.task.file.folder.projectId,
    } as ResourceScope | null;
  }

  private async roleResolver(resourceId: bigint) {
    const resource = await this.prisma.role.findUnique({
      where: {
        id: resourceId,
      },
      select: {
        projectId: true,
        companyId: true,
      },
    });
    if (!resource) {
      return new NotFoundException(ERROR.NFROLE);
    }
    return {
      companyId: resource.companyId,
      projectId: resource.projectId,
    } as ResourceScope | null;
  }

  private async projectResolver(resourceId: bigint) {
    const resource = await this.prisma.project.findUnique({
      where: {
        id: resourceId,
      },
      select: {
        companyId: true,
      },
    });
    if (!resource) {
      return new NotFoundException(ERROR.NFPROJECT);
    }
    return {
      companyId: resource.companyId,
      projectId: undefined,
    } as ResourceScope | null;
  }

  private async companyResolver(resourceId: bigint) {
    const resource = await this.prisma.project.findUnique({
      where: {
        id: resourceId,
      },
      select: {
        companyId: true,
      },
    });
    if (!resource) {
      return new NotFoundException(ERROR.NFCOMPANY);
    }
    return {
      companyId: resource.companyId,
      projectId: undefined,
    } as ResourceScope | null;
  }
}
