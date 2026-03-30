import { Injectable } from '@nestjs/common';
import { prisma } from '../../config/database';

@Injectable()
export class InvoicesRepository {
  readonly prisma = prisma;
}
