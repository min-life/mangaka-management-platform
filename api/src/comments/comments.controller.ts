import { Body, Controller, Delete, Param, ParseIntPipe, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { UpdateCommentReqDto } from './dto';
import { Permissions } from '../share/decorators';
import { CommentResDto } from '../frames/dto'; // wait, it is exported from frames/dto? Or maybe I shouldn't strictly type it if I don't import it. Wait, I will use CommentResponseDto from frames/dto.

@ApiTags('Comments')
@ApiBearerAuth()
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Permissions({
    mode: 'ANY',
    permissions: ['project:comment.update', 'project:owner'],
    resource: 'COMMENT',
  })
  @ApiOperation({ summary: 'Update comment' })
  @ApiParam({ name: 'id', type: Number, description: 'Comment id' })
  @Patch(':id')
  async updateComment(@Param('id', ParseIntPipe) id: number, @Body() data: UpdateCommentReqDto) {
    const comment = await this.commentsService.updateComment(id, data);
    return { data: comment };
  }

  @Permissions({
    mode: 'ANY',
    permissions: ['project:comment.delete', 'project:owner'],
    resource: 'COMMENT',
  })
  @ApiOperation({ summary: 'Delete comment' })
  @ApiParam({ name: 'id', type: Number, description: 'Comment id' })
  @Delete(':id')
  async deleteComment(@Param('id', ParseIntPipe) id: number) {
    const comment = await this.commentsService.deleteComment(id);
    return { data: comment };
  }
}
