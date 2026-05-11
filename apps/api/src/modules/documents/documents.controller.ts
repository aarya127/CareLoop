import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DocumentsService } from './documents.service';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  /** GET /documents/patient/:patientId?practiceId=&category= */
  @Get('patient/:patientId')
  findByPatient(@Param('patientId') patientId: string, @Query() query: any) {
    return this.documentsService.findByPatientId(patientId, query);
  }

  /**
   * POST /documents/upload-url
   * Step 1: validate MIME + size, create pending record, return presigned PUT URL.
   * Body: { practiceId, patientId?, uploadedBy?, category, fileName, mimeType, sizeBytes?, checksumSha256? }
   */
  @Post('upload-url')
  getUploadUrl(@Body() dto: any) {
    return this.documentsService.getUploadUrl(dto);
  }

  /**
   * POST /documents/:id/confirm
   * Step 2: client signals the PUT to S3 succeeded; marks document active.
   * Body: { checksumSha256? }
   */
  @Post(':id/confirm')
  @HttpCode(HttpStatus.OK)
  confirmUpload(@Param('id') id: string, @Body() dto: any) {
    return this.documentsService.confirmUpload(id, dto);
  }

  /**
   * GET /documents/:id/download-url
   * Returns a 15-minute presigned GET URL for secure file access.
   */
  @Get(':id/download-url')
  getDownloadUrl(@Param('id') id: string) {
    return this.documentsService.getDownloadUrl(id);
  }

  /** DELETE /documents/:id */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @Query('actorUserId') actorUserId?: string) {
    return this.documentsService.remove(id, actorUserId);
  }

  /** Legacy POST /documents — alias for upload-url */
  @Post()
  create(@Body() dto: any) {
    return this.documentsService.create(dto);
  }
}
