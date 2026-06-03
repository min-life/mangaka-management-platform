import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// ChuongTV #005
@Injectable()
export class AccessTokenGuard extends AuthGuard('jwt') {}
