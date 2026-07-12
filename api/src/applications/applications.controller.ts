import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Permissions } from '../share/decorators';
import type { JwtPayload } from '../auth/interfaces';
import { ApplicationsService } from './applications.service';
import {
  ApplicationResponseDto,
  ApplicationsResponseDto,
  QueryApplicationsReqDto,
  UpdateApplicationReqDto,
  UpdateApplicationStatusReqDto,
  ApplicationMaterialReqDto,
  ApplicationVoteResponseDto,
  VoteApplicationReqDto,
} from './dto';

import {
  CommentResponseDto,
  CommentsResponseDto,
  CreateCommentReqDto,
  QueryCommentsReqDto,
} from '../frames/dto';
import { ApiCreatedResponse } from '@nestjs/swagger';

@ApiTags('Applications')
@ApiBearerAuth()
@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Permissions({
    mode: 'ANY',
    permissions: ['project:read', 'board:leader', 'board:member', 'board:owner', 'project:owner'],
    resource: 'APPLICATION',
  })
  @ApiOperation({ summary: 'Get application comments' })
  @ApiParam({ name: 'id', type: Number, description: 'Application id' })
  @ApiOkResponse({
    description: 'Application comments retrieved successfully',
    type: CommentsResponseDto,
  })
  @Get(':id/comments')
  async getApplicationComments(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: QueryCommentsReqDto,
  ) {
    const result = await this.applicationsService.getApplicationComments(
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
    permissions: [
      'project:comment.create',
      'board:leader',
      'project:owner',
      'board:member',
      'board:owner',
    ],
    resource: 'APPLICATION',
  })
  @ApiOperation({ summary: 'Create comment for application' })
  @ApiParam({ name: 'id', type: Number, description: 'Application id' })
  @ApiCreatedResponse({ description: 'Comment created successfully', type: CommentResponseDto })
  @Post(':id/comments')
  async createComment(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: JwtPayload,
    @Body() data: CreateCommentReqDto,
  ) {
    const comment = await this.applicationsService.createComment(id, {
      ...data,
      userId: currentUser.userId,
    });
    return {
      data: comment,
    };
  }

  @ApiOperation({ summary: 'Get applications' })
  @ApiOkResponse({
    description: 'Applications retrieved successfully',
    type: ApplicationsResponseDto,
  })
  @Get()
  async getApplications(
    @CurrentUser() currentUser: JwtPayload,
    @Query() query: QueryApplicationsReqDto,
  ) {
    const result = await this.applicationsService.getApplications(
      {
        projectId: query.projectId,
        search: query.search,
        type: query.type,
        status: query.status,
        userId: currentUser.userId,
      },
      query.field && query.order ? { field: query.field, order: query.order } : undefined,
      query.page && query.limit ? { page: query.page, limit: query.limit } : undefined,
    );
    return {
      data: result.applications,
      pagination: result.pagination,
    };
  }

  @Permissions({
    mode: 'ANY',
    permissions: [
      'project:application.read',
      'board:leader',
      'project:owner',
      'board:member',
      'board:owner',
    ],
    resource: 'APPLICATION',
  })
  @ApiOperation({ summary: 'Get application details' })
  @ApiParam({ name: 'id', type: Number, description: 'Application id' })
  @ApiOkResponse({
    description: 'Application retrieved successfully',
    type: ApplicationResponseDto,
  })
  @Get(':id')
  async getApplicationById(@Param('id', ParseIntPipe) id: number) {
    const application = await this.applicationsService.getApplicationById(id);
    return {
      data: application,
    };
  }

  @Permissions({
    mode: 'ANY',
    permissions: ['project:application.update', 'project:owner'],
    resource: 'APPLICATION',
  })
  @ApiOperation({ summary: 'Update application' })
  @ApiParam({ name: 'id', type: Number, description: 'Application id' })
  @ApiOkResponse({ description: 'Application updated successfully', type: ApplicationResponseDto })
  @Patch(':id')
  async updateApplication(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: JwtPayload,
    @Body() data: UpdateApplicationReqDto,
  ) {
    const application = await this.applicationsService.updateApplication(id, {
      ...data,
      userId: currentUser.userId,
    });
    return {
      data: application,
    };
  }

  @Permissions({
    mode: 'ANY',
    permissions: ['project:application.delete', 'project:owner'],
    resource: 'APPLICATION',
  })
  @ApiOperation({ summary: 'Delete application' })
  @ApiParam({ name: 'id', type: Number, description: 'Application id' })
  @ApiOkResponse({ description: 'Application deleted successfully' })
  @Delete(':id')
  async deleteApplication(@Param('id', ParseIntPipe) id: number) {
    await this.applicationsService.deleteApplication(id);
  }

  @Permissions({
    mode: 'ANY',
    permissions: [
      'project:application.approve',
      'board:leader',
      'project:owner',
      'project:application.read',
      'project:application.create',
      'project:application.update',
    ],
    resource: 'APPLICATION',
  })
  @ApiOperation({ summary: 'Update application status' })
  @ApiParam({ name: 'id', type: Number, description: 'Application id' })
  @ApiOkResponse({
    description: 'Application status updated successfully',
    type: ApplicationResponseDto,
  })
  @Patch(':id/status')
  async updateApplicationStatus(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: JwtPayload,
    @Body() data: UpdateApplicationStatusReqDto,
  ) {
    const application = await this.applicationsService.updateApplicationStatus(id, {
      status: data.status,
      userId: currentUser.userId,
      voteDeadline: data.voteDeadline,
      comment: data.comment,
    });
    return {
      data: application,
    };
  }

  @Permissions({
    mode: 'ANY',
    permissions: [
      'project:application.read',
      'project:owner',
      'board:leader',
      'board:member',
      'board:owner',
    ],
    resource: 'APPLICATION',
  })
  @ApiOperation({ summary: 'Get application votes' })
  @ApiParam({ name: 'id', type: Number, description: 'Application id' })
  @ApiOkResponse({
    description: 'Application votes retrieved successfully',
    type: [ApplicationVoteResponseDto],
  })
  @Get(':id/votes')
  async getApplicationVotes(@Param('id', ParseIntPipe) id: number) {
    const votes = await this.applicationsService.getVotes(id);
    return votes;
  }

  @Permissions({
    mode: 'ANY',
    permissions: ['board:leader', 'board:member', 'board:owner'],
    resource: 'APPLICATION',
  })
  @ApiOperation({ summary: 'Cast a vote on application' })
  @ApiParam({ name: 'id', type: Number, description: 'Application id' })
  @ApiOkResponse({
    description: 'Vote casted successfully',
    type: ApplicationVoteResponseDto,
  })
  @Post(':id/votes')
  async castApplicationVote(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: JwtPayload,
    @Body() data: VoteApplicationReqDto,
  ) {
    const vote = await this.applicationsService.castVote(
      id,
      currentUser.userId,
      data.decision,
      data.comment,
    );
    return vote;
  }

  @Permissions({
    mode: 'ANY',
    permissions: ['project:application.update', 'project:owner'],
    resource: 'APPLICATION',
  })
  @ApiOperation({ summary: 'Add a material item to application' })
  @ApiParam({ name: 'id', type: Number, description: 'Application id' })
  @ApiOkResponse({ description: 'Application updated successfully', type: ApplicationResponseDto })
  @Post(':id/materials/add')
  async addApplicationMaterialItem(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: JwtPayload,
    @Body() data: ApplicationMaterialReqDto,
  ) {
    const application = await this.applicationsService.addApplicationMaterial(
      id,
      currentUser.userId,
      data.materialItem,
    );
    return { data: application };
  }

  @Permissions({
    mode: 'ANY',
    permissions: ['project:application.update', 'project:owner'],
    resource: 'APPLICATION',
  })
  @ApiOperation({ summary: 'Update a material item in application' })
  @ApiParam({ name: 'id', type: Number, description: 'Application id' })
  @ApiParam({ name: 'index', type: Number, description: 'Index of the material to update' })
  @ApiOkResponse({ description: 'Application updated successfully', type: ApplicationResponseDto })
  @Patch(':id/materials/:index')
  async updateApplicationMaterialItem(
    @Param('id', ParseIntPipe) id: number,
    @Param('index', ParseIntPipe) index: number,
    @CurrentUser() currentUser: JwtPayload,
    @Body() data: ApplicationMaterialReqDto,
  ) {
    const application = await this.applicationsService.updateApplicationMaterial(
      id,
      currentUser.userId,
      index,
      data.materialItem,
    );
    return { data: application };
  }

  @Permissions({
    mode: 'ANY',
    permissions: ['project:application.update', 'project:owner'],
    resource: 'APPLICATION',
  })
  @ApiOperation({ summary: 'Delete a material item from application' })
  @ApiParam({ name: 'id', type: Number, description: 'Application id' })
  @ApiParam({ name: 'index', type: Number, description: 'Index of the material to delete' })
  @ApiOkResponse({ description: 'Application updated successfully', type: ApplicationResponseDto })
  @Delete(':id/materials/:index')
  async deleteApplicationMaterialItem(
    @Param('id', ParseIntPipe) id: number,
    @Param('index', ParseIntPipe) index: number,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    const application = await this.applicationsService.deleteApplicationMaterial(
      id,
      currentUser.userId,
      index,
    );
    return { data: application };
  }
}
