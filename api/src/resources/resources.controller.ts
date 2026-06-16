import { Body, Controller, Delete, Get, Param, Patch, Post, Put } from '@nestjs/common';
import { CurrentUser } from '../share/decorators';
import type { JwtPayload } from '../auth/interfaces';
import { ResourcesService } from './resources.service';

@Controller()
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Get('editor-boards')
  findEditorBoards() {
    return this.resourcesService.editorBoards.findAll();
  }

  @Post('editor-boards')
  createEditorBoard(@CurrentUser() user: JwtPayload, @Body() body: any) {
    return this.resourcesService.editorBoards.create(body, user.userId);
  }

  @Get('editor-boards/:id')
  findEditorBoard(@Param('id') id: string) {
    return this.resourcesService.editorBoards.findOne(Number(id));
  }

  @Patch('editor-boards/:id')
  updateEditorBoard(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() body: any) {
    return this.resourcesService.editorBoards.update(Number(id), body, user.userId);
  }

  @Delete('editor-boards/:id')
  deleteEditorBoard(@Param('id') id: string) {
    return this.resourcesService.editorBoards.delete(Number(id));
  }

  @Put('editor-boards/:id/users/:userId')
  assignEditorBoardUser(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body('isLead') isLead?: boolean,
  ) {
    return this.resourcesService.assignEditorBoardUser(Number(id), Number(userId), isLead);
  }

  @Delete('editor-boards/:id/users/:userId')
  removeEditorBoardUser(@Param('id') id: string, @Param('userId') userId: string) {
    return this.resourcesService.removeEditorBoardUser(Number(id), Number(userId));
  }

  @Get('folders')
  findFolders() {
    return this.resourcesService.folders.findAll();
  }

  @Post('folders')
  createFolder(@CurrentUser() user: JwtPayload, @Body() body: any) {
    return this.resourcesService.folders.create(body, user.userId);
  }

  @Get('folders/:id')
  findFolder(@Param('id') id: string) {
    return this.resourcesService.folders.findOne(Number(id));
  }

  @Patch('folders/:id')
  updateFolder(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() body: any) {
    return this.resourcesService.folders.update(Number(id), body, user.userId);
  }

  @Delete('folders/:id')
  deleteFolder(@Param('id') id: string) {
    return this.resourcesService.folders.delete(Number(id));
  }

  @Get('files')
  findFiles() {
    return this.resourcesService.files.findAll();
  }

  @Post('files')
  createFile(@CurrentUser() user: JwtPayload, @Body() body: any) {
    return this.resourcesService.files.create(body, user.userId);
  }

  @Get('files/:id')
  findFile(@Param('id') id: string) {
    return this.resourcesService.files.findOne(Number(id));
  }

  @Patch('files/:id')
  updateFile(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() body: any) {
    return this.resourcesService.files.update(Number(id), body, user.userId);
  }

  @Delete('files/:id')
  deleteFile(@Param('id') id: string) {
    return this.resourcesService.files.delete(Number(id));
  }

  @Get('file-materials')
  findFileMaterials() {
    return this.resourcesService.fileMaterials.findAll();
  }

  @Post('file-materials')
  createFileMaterial(@CurrentUser() user: JwtPayload, @Body() body: any) {
    return this.resourcesService.fileMaterials.create(body, user.userId);
  }

  @Get('file-materials/:id')
  findFileMaterial(@Param('id') id: string) {
    return this.resourcesService.fileMaterials.findOne(Number(id));
  }

  @Patch('file-materials/:id')
  updateFileMaterial(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() body: any) {
    return this.resourcesService.fileMaterials.update(Number(id), body, user.userId);
  }

  @Delete('file-materials/:id')
  deleteFileMaterial(@Param('id') id: string) {
    return this.resourcesService.fileMaterials.delete(Number(id));
  }

  @Get('tasks')
  findTasks() {
    return this.resourcesService.tasks.findAll();
  }

  @Post('tasks')
  createTask(@CurrentUser() user: JwtPayload, @Body() body: any) {
    return this.resourcesService.tasks.create(body, user.userId);
  }

  @Get('tasks/:id')
  findTask(@Param('id') id: string) {
    return this.resourcesService.tasks.findOne(Number(id));
  }

  @Patch('tasks/:id')
  updateTask(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() body: any) {
    return this.resourcesService.tasks.update(Number(id), body, user.userId);
  }

  @Delete('tasks/:id')
  deleteTask(@Param('id') id: string) {
    return this.resourcesService.tasks.delete(Number(id));
  }

  @Get('task-comment-frames')
  findTaskCommentFrames() {
    return this.resourcesService.taskCommentFrames.findAll();
  }

  @Post('task-comment-frames')
  createTaskCommentFrame(@CurrentUser() user: JwtPayload, @Body() body: any) {
    return this.resourcesService.taskCommentFrames.create(body, user.userId);
  }

  @Get('task-comment-frames/:id')
  findTaskCommentFrame(@Param('id') id: string) {
    return this.resourcesService.taskCommentFrames.findOne(Number(id));
  }

  @Patch('task-comment-frames/:id')
  updateTaskCommentFrame(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.resourcesService.taskCommentFrames.update(Number(id), body, user.userId);
  }

  @Delete('task-comment-frames/:id')
  deleteTaskCommentFrame(@Param('id') id: string) {
    return this.resourcesService.taskCommentFrames.delete(Number(id));
  }

  @Get('task-comments')
  findTaskComments() {
    return this.resourcesService.taskComments.findAll();
  }

  @Post('task-comments')
  createTaskComment(@CurrentUser() user: JwtPayload, @Body() body: any) {
    return this.resourcesService.taskComments.create(body, user.userId);
  }

  @Get('task-comments/:id')
  findTaskComment(@Param('id') id: string) {
    return this.resourcesService.taskComments.findOne(Number(id));
  }

  @Patch('task-comments/:id')
  updateTaskComment(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() body: any) {
    return this.resourcesService.taskComments.update(Number(id), body, user.userId);
  }

  @Delete('task-comments/:id')
  deleteTaskComment(@Param('id') id: string) {
    return this.resourcesService.taskComments.delete(Number(id));
  }

  @Get('applications')
  findApplications() {
    return this.resourcesService.applications.findAll();
  }

  @Post('applications')
  createApplication(@CurrentUser() user: JwtPayload, @Body() body: any) {
    return this.resourcesService.applications.create(body, user.userId);
  }

  @Get('applications/:id')
  findApplication(@Param('id') id: string) {
    return this.resourcesService.applications.findOne(Number(id));
  }

  @Patch('applications/:id')
  updateApplication(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() body: any) {
    return this.resourcesService.applications.update(Number(id), body, user.userId);
  }

  @Delete('applications/:id')
  deleteApplication(@Param('id') id: string) {
    return this.resourcesService.applications.delete(Number(id));
  }

  @Get('project-stats')
  findProjectStats() {
    return this.resourcesService.projectStats.findAll();
  }

  @Post('project-stats')
  createProjectStat(@Body() body: any) {
    return this.resourcesService.projectStats.create(body);
  }

  @Get('project-stats/:id')
  findProjectStat(@Param('id') id: string) {
    return this.resourcesService.projectStats.findOne(Number(id));
  }

  @Patch('project-stats/:id')
  updateProjectStat(@Param('id') id: string, @Body() body: any) {
    return this.resourcesService.projectStats.update(Number(id), body);
  }

  @Delete('project-stats/:id')
  deleteProjectStat(@Param('id') id: string) {
    return this.resourcesService.projectStats.delete(Number(id));
  }
}
