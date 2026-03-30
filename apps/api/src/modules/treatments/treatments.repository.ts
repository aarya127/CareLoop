import { Injectable } from '@nestjs/common';
import { prisma } from '../../config/database';

@Injectable()
export class TreatmentsRepository {
  readonly prisma = prisma;
}
