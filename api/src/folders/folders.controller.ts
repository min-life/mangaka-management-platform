import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';

import { FoldersService } from './folders.service';
import { CreateArcDto } from './dto/create-arc.dto';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { UpdateArcDto } from './dto/update-arc.dto';

// PhucTD #011 start
@Controller()
export class FoldersController {
  constructor(private readonly foldersService: FoldersService) {}

  @Get('folders')
  findArcs() {
    return this.foldersService.findArcs();
  }

  @Post('folders')
  createArc(@Body() createArcDto: CreateArcDto) {
    return this.foldersService.createArc(createArcDto);
  }

  @Get('folders/:id')
  findArc(@Param('id') id: string) {
    return this.foldersService.findArc(id);
  }

  @Patch('folders/:id')
  updateArc(@Param('id') id: string, @Body() updateArcDto: UpdateArcDto) {
    return this.foldersService.updateArc(id, updateArcDto);
  }

  @Delete('folders/:id')
  removeArc(@Param('id') id: string) {
    return this.foldersService.removeArc(id);
  }

  @Get('folders/:folderId/children')
  findChapters(@Param('folderId') arcId: string) {
    return this.foldersService.findChapters(arcId);
  }

  @Post('folders/:folderId/children')
  createChapter(@Param('folderId') arcId: string, @Body() createChapterDto: CreateChapterDto) {
    return this.foldersService.createChapter(arcId, createChapterDto);
  }
}
// PhucTD #011 end
