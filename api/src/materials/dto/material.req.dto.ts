import { ApiProperty } from '@nestjs/swagger';

export class UpdateMaterialReqDto {
  @ApiProperty({
    example: { layers: ['background', 'characters'], colors: ['#FF0000', '#00FF00'] },
  })
  materials!: unknown;
}
