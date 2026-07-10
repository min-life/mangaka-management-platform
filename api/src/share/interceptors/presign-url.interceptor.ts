import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { AwsS3Service } from '../services/aws-s3.service';

@Injectable()
export class PresignUrlInterceptor implements NestInterceptor {
  constructor(private readonly awsS3Service: AwsS3Service) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      mergeMap(async (data) => {
        return await this.processData(data);
      }),
    );
  }

  private async processData(data: any): Promise<any> {
    if (data === null || data === undefined) return data;

    if (typeof data === 'string') {
      if (this.awsS3Service.isS3Url(data)) {
        return await this.awsS3Service.getPresignedUrl(data);
      }
      return data;
    }

    if (Array.isArray(data)) {
      return Promise.all(data.map((item) => this.processData(item)));
    }

    if (typeof data === 'object') {
      if (data instanceof Date) return data;
      
      const result: any = {};
      for (const [key, value] of Object.entries(data)) {
        result[key] = await this.processData(value);
      }
      return result;
    }

    return data;
  }
}
