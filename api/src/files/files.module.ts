import { Module } from '@nestjs/common';
import { AwsS3Service } from '../share/services/aws-s3.service';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';

@Module({
  controllers: [FilesController],
  providers: [FilesService, AwsS3Service],
  exports: [FilesService],
})
export class FilesModule {}
