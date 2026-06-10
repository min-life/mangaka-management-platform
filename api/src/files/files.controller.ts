import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';

import { FilesService } from './files.service';
import { CreateFileDto } from './dto/create-file.dto';
import { UpdateFileDto } from './dto/update-file.dto';

// PhucTD #011 start
@Controller()
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Get('folders/:folderId/files')
  findPages(@Param('folderId') chapterId: string) {
    return this.filesService.findPages(chapterId);
  }

  @Post('folders/:folderId/files')
  createPage(@Param('folderId') chapterId: string, @Body() createFileDto: CreateFileDto) {
    return this.filesService.createPage(chapterId, createFileDto);
  }

  @Get('files/:id')
  findPage(@Param('id') id: string) {
    return this.filesService.findPage(id);
  }

  @Patch('files/:id')
  updatePage(@Param('id') id: string, @Body() updateFileDto: UpdateFileDto) {
    return this.filesService.updatePage(id, updateFileDto);
  }

  @Delete('files/:id')
  removePage(@Param('id') id: string) {
    return this.filesService.removePage(id);
  }
}
// PhucTD #011 end
