import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, Permissions } from '../share/decorators';
import type { JwtPayload } from '../auth/interfaces';
import { FramesService } from './frames.service';
import {
  CommentResponseDto,
  CommentsResponseDto,
  CreateCommentReqDto,
  FrameResponseDto,
  QueryCommentsReqDto,
  UpdateFrameReqDto,
} from './dto';

@ApiTags('Frames')
@ApiBearerAuth()
@Controller('frames')
export class FramesController {
  constructor(private readonly framesService: FramesService) {}

  @Permissions({
    mode: 'ANY',
    permissions: ['project:read', 'board:leader'],
    resource: 'FRAME',
  })
  @ApiOperation({ summary: 'Get frame details' })
  @ApiParam({ name: 'id', type: Number, description: 'Frame id' })
  @ApiOkResponse({
    description: 'Frame retrieved successfully',
    type: FrameResponseDto,
  })
  @Get(':id')
  async getFrameById(@Param('id', ParseIntPipe) id: number) {
    const frame = await this.framesService.getFrameById(id);
    return {
      data: frame,
    };
  }

  @Permissions({
    mode: 'ANY',
    permissions: ['project:frame.update', 'board:leader'],
    resource: 'FRAME',
  })
  @ApiOperation({ summary: 'Update frame' })
  @ApiParam({ name: 'id', type: Number, description: 'Frame id' })
  @ApiOkResponse({ description: 'Frame updated successfully', type: FrameResponseDto })
  @Patch(':id')
  async updateFrame(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: JwtPayload,
    @Body() data: UpdateFrameReqDto,
  ) {
    const frame = await this.framesService.updateFrame(id, {
      ...data,
      userId: currentUser.userId,
    });
    return {
      data: frame,
    };
  }

  @Permissions({
    mode: 'ANY',
    permissions: ['project:frame.delete', 'board:leader'],
    resource: 'FRAME',
  })
  @ApiOperation({ summary: 'Delete frame' })
  @ApiParam({ name: 'id', type: Number, description: 'Frame id' })
  @ApiOkResponse({ description: 'Frame deleted successfully' })
  @Delete(':id')
  async deleteFrame(@Param('id', ParseIntPipe) id: number) {
    await this.framesService.deleteFrame(id);
  }

  @Permissions({
    mode: 'ANY',
    permissions: ['project:read', 'board:leader'],
    resource: 'COMMENT',
  })
  @ApiOperation({ summary: 'Get frame comments' })
  @ApiParam({ name: 'id', type: Number, description: 'Frame id' })
  @ApiOkResponse({
    description: 'Frame comments retrieved successfully',
    type: CommentsResponseDto,
  })
  @Get(':id/comments')
  async getFrameComments(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: QueryCommentsReqDto,
  ) {
    const result = await this.framesService.getFrameComments(
      id,
      query.field && query.order ? { field: query.field, order: query.order } : undefined,
      query.page && query.limit ? { page: query.page, limit: query.limit } : undefined,
    );
    return {
      data: result.comments,
      pagination: result.pagination,
    };
  }

  @Permissions({
    mode: 'ANY',
    permissions: ['project:comment.create', 'board:leader'],
    resource: 'COMMENT',
  })
  @ApiOperation({ summary: 'Create comment for frame' })
  @ApiParam({ name: 'id', type: Number, description: 'Frame id' })
  @ApiCreatedResponse({ description: 'Comment created successfully', type: CommentResponseDto })
  @Post(':id/comments')
  async createComment(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: JwtPayload,
    @Body() data: CreateCommentReqDto,
  ) {
    const comment = await this.framesService.createComment(id, {
      ...data,
      userId: currentUser.userId,
    });
    return {
      data: comment,
    };
  }
}
