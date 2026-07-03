import { Module } from '@nestjs/common';
import { MaterialsController } from './materials.controller';
import { MaterialsService } from './materials.service';

import { AwsS3Service } from '../share/services/aws-s3.service';
import { FramesModule } from '../frames/frames.module';

@Module({
  imports: [FramesModule],
  controllers: [MaterialsController],
  providers: [MaterialsService, AwsS3Service],
  exports: [MaterialsService],
})
export class MaterialsModule {}
