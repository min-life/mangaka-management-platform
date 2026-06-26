import { ApiProperty } from '@nestjs/swagger';
import { UserResDto } from '../../share/dto';

export class UserDetailResDto extends UserResDto {
  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({ example: false })
  googleLinked!: boolean;

  @ApiProperty({ example: '2026-06-18T03:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-06-18T03:00:00.000Z' })
  updatedAt!: Date;
}

// Defining PaginationResDto here locally to avoid circular dependencies or tight coupling with projects, matching the pattern in task.res.dto.ts
export class UsersPaginationResDto {
  @ApiProperty({ example: 25 })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 10 })
  limit!: number;

  @ApiProperty({ example: 3 })
  totalPages!: number;
}

export class UsersResponseDto {
  @ApiProperty({ type: [UserDetailResDto] })
  data!: UserDetailResDto[];

  @ApiProperty({ type: UsersPaginationResDto })
  pagination!: UsersPaginationResDto;
}
