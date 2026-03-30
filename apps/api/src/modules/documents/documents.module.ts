import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { DocumentsRepository } from './documents.repository';
import { StorageService } from './storage.service';

@Module({
  controllers: [DocumentsController],
  providers: [DocumentsService, DocumentsRepository, StorageService],
  exports: [DocumentsService, StorageService],
})
export class DocumentsModule {}
