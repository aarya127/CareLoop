import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DocumentsService } from './documents.service';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  /** GET /documents/patient/:patientId?category= */
  @Get('patient/:patientId')
  findByPatient(@Param('patientId') patientId: string, @Query() query: any, @Req() req: any) {
    return this.documentsService.findByPatientId(req.user.practiceId, patientId, query);
  }

  /**
   * POST /documents/upload-url
   * Step 1: validate MIME + size, create pending record, return presigned PUT URL.
   * Body: { patientId?, category, fileName, mimeType, sizeBytes?, checksumSha256? }
   * practiceId + uploader are taken from the authenticated session.
   */
  @Post('upload-url')
  getUploadUrl(@Body() dto: any, @Req() req: any) {
    return this.documentsService.getUploadUrl(req.user.practiceId, {
      ...dto,
      uploadedBy: req.user.id,
    });
  }

  /**
   * POST /documents/:id/confirm
   * Step 2: client signals the PUT to S3 succeeded; marks document active.
   * Body: { checksumSha256? }
   */
  @Post(':id/confirm')
  @HttpCode(HttpStatus.OK)
  confirmUpload(@Param('id') id: string, @Body() dto: any, @Req() req: any) {
    return this.documentsService.confirmUpload(req.user.practiceId, id, {
      ...dto,
      actorUserId: req.user.id,
    });
  }

  /**
   * GET /documents/:id/download-url
   * Returns a 15-minute presigned GET URL for secure file access.
   */
  @Get(':id/download-url')
  getDownloadUrl(@Param('id') id: string, @Req() req: any) {
    return this.documentsService.getDownloadUrl(req.user.practiceId, id);
  }

  /** DELETE /documents/:id */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @Req() req: any) {
    return this.documentsService.remove(req.user.practiceId, id, req.user.id);
  }

  /** Legacy POST /documents — alias for upload-url */
  @Post()
  create(@Body() dto: any, @Req() req: any) {
    return this.documentsService.getUploadUrl(req.user.practiceId, {
      ...dto,
      uploadedBy: req.user.id,
    });
  }
}
