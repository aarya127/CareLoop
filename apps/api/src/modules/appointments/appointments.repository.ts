import { Injectable } from '@nestjs/common';
import { prisma } from '../../config/database';

@Injectable()
export class AppointmentsRepository {
  readonly prisma = prisma;
}
