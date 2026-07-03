import { Injectable } from '@nestjs/common';
import type { DocumentCategory } from '@prisma/client';
import { prisma } from '../../config/database';

@Injectable()
export class DocumentsRepository {
  readonly prisma = prisma;

  async findByPatientId(
    patientId: string,
    practiceId: string,
    category?: string,
  ): Promise<any[]> {
    return this.prisma.document.findMany({
      where: {
        patientId,
        practiceId,
        status: 'active',
        ...(category ? { category: category as DocumentCategory } : {}),
      },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  async findById(id: string): Promise<any | null> {
    return this.prisma.document.findUnique({ where: { id } });
  }

  async createPending(data: {
    practiceId: string;
    patientId?: string;
    uploadedBy?: string;
    category: string;
    fileName: string;
    mimeType: string;
    storageKey: string;
    sizeBytes?: number;
    checksumSha256?: string;
  }): Promise<any> {
    return this.prisma.document.create({
      data: { ...data, category: data.category as DocumentCategory, status: 'uploading' },
    });
  }

  async activate(id: string, checksumSha256?: string): Promise<any> {
    return this.prisma.document.update({
      where: { id },
      data: {
        status: 'active',
        uploadedAt: new Date(),
        ...(checksumSha256 ? { checksumSha256 } : {}),
      },
    });
  }

  async softDelete(id: string): Promise<any> {
    return this.prisma.document.update({
      where: { id },
      data: { status: 'deleted' },
    });
  }
}
