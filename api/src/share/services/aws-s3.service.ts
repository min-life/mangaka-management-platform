import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { requireEnv } from '../helpers/env';
import { ERROR } from '../constants/message-error';

@Injectable()
export class AwsS3Service {
  private readonly logger = new Logger(AwsS3Service.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly region: string;

  constructor() {
    this.region = requireEnv('AWS_REGION');
    this.bucketName = requireEnv('AWS_S3_BUCKET_NAME');
    
    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: requireEnv('AWS_ACCESS_KEY_ID'),
        secretAccessKey: requireEnv('AWS_SECRET_ACCESS_KEY'),
      },
    });
  }

  /**
   * Check if a URL is an S3 URL
   */
  isS3Url(url: string): boolean {
    if (typeof url !== 'string') return false;
    const baseUrl = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/`;
    return url.startsWith(baseUrl);
  }

  /**
   * Generate a pre-signed URL for downloading/viewing an object
   * @param keyOrUrl The S3 object key or full S3 url
   * @param expiresIn Validity duration in seconds (default: 3600 = 1 hour)
   * @param downloadName Optional. If provided, forces download with this filename
   * @returns Pre-signed URL string
   */
  async getPresignedUrl(keyOrUrl: string, expiresIn = 3600, downloadName?: string): Promise<string> {
    try {
      const baseUrl = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/`;
      const key = keyOrUrl.startsWith(baseUrl) ? keyOrUrl.replace(baseUrl, '') : keyOrUrl;

      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        ...(downloadName && { ResponseContentDisposition: `attachment; filename="${downloadName}"` }),
      });

      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error) {
      this.logger.error(`Generate presigned URL fail: ${keyOrUrl}`, error instanceof Error ? error.stack : String(error));
      throw new InternalServerErrorException(ERROR.SVGETFILEMATERIALS);
    }
  }

  /**
   * Upload a file to AWS S3 and return its public URL
   * @param file The multer file object
   * @param key The S3 object key (path and filename)
   * @returns The public URL of the uploaded file
   */
  async uploadFile(file: Express.Multer.File, key: string): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      await this.s3Client.send(command);

      return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
    } catch (error) {
      this.logger.error(`Upload file to S3 fail: ${key}`, error instanceof Error ? error.stack : String(error));
      throw new InternalServerErrorException(ERROR.SVCREATEMATERIAL);
    }
  }
}
