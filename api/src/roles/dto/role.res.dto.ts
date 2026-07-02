import { ApiProperty } from '@nestjs/swagger';
import { RoleResDto } from '../../projects/dto/project.res.dto';

export class RoleResponseDto {
  @ApiProperty({ type: RoleResDto })
  data!: RoleResDto;
}

export class RolesResponseDto {
  @ApiProperty({ type: [RoleResDto] })
  data!: RoleResDto[];
}
