import { Injectable } from '@nestjs/common';
import { prisma } from '../../config/database';

@Injectable()
export class UsersRepository {
  readonly prisma = prisma;
}
