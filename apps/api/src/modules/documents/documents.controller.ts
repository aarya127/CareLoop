import { Controller, Get, Post, Delete, Param, Body, Query } from '@nestjs/common';
import { DocumentsService } from './documents.service';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get('patient/:patientId')
  findByPatient(@Param('patientId') patientId: string, @Query() query: any) {
    return this.documentsService.findByPatientId(patientId, query);
  }

  @Post('upload-url')
  getUploadUrl(@Body() dto: any) {
    return this.documentsService.getUploadUrl(dto);
  }

  @Post()
  create(@Body() dto: any) {
    return this.documentsService.create(dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.documentsService.remove(id);
  }
}
