import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { prisma } from '@careloop/db';
import { SessionService } from '../auth/session.service';
import type { UpdateUserDto } from './dto';

@Injectable()
export class UsersService {
  constructor(private readonly sessionService: SessionService) {}

  async findAll(practiceId: string): Promise<any[]> {
    return prisma.user.findMany({
      where: { practiceId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        practiceId: true,
        status: true,
        createdAt: true,
        deletedAt: true,
        deletedReason: true,
        roles: {
          include: { role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(practiceId: string, id: string): Promise<any> {
    const user = await prisma.user.findFirst({
      where: { id, practiceId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        practiceId: true,
        status: true,
        createdAt: true,
        deletedAt: true,
        deletedReason: true,
        roles: {
          include: { role: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(practiceId: string, id: string, dto: UpdateUserDto): Promise<any> {
    if (dto.firstName === undefined && dto.lastName === undefined) {
      throw new BadRequestException('At least one user field must be provided');
    }
    const user = await prisma.user.findFirst({ where: { id, practiceId }, select: { id: true } });
    if (!user) throw new NotFoundException('User not found');

    return prisma.user.update({
      where: { id },
      data: {
        ...(dto.firstName !== undefined ? { firstName: dto.firstName.trim() } : {}),
        ...(dto.lastName !== undefined ? { lastName: dto.lastName.trim() } : {}),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        practiceId: true,
        status: true,
        createdAt: true,
        deletedAt: true,
        deletedReason: true,
      },
    });
  }

  async remove(practiceId: string, actorUserId: string, id: string, reason?: string): Promise<any> {
    if (actorUserId === id) {
      throw new BadRequestException('Administrators cannot remove their own account');
    }

    const now = new Date();
    const removed = await prisma.$transaction(async (tx) => {
      // Updating the practice row serializes administrator removals within a
      // tenant, preventing two concurrent requests from both observing two admins.
      await tx.practice.update({ where: { id: practiceId }, data: { updatedAt: now } });

      const user = await tx.user.findFirst({
        where: { id, practiceId, status: 'active', deletedAt: null },
        select: { id: true, roles: { select: { role: { select: { name: true } } } } },
      });
      if (!user) throw new NotFoundException('User not found');

      const isAdmin = user.roles.some(
        (assignment) => assignment.role.name.toLowerCase() === 'admin',
      );
      if (isAdmin) {
        const activeAdminCount = await tx.user.count({
          where: {
            practiceId,
            status: 'active',
            deletedAt: null,
            roles: { some: { role: { name: { equals: 'admin', mode: 'insensitive' } } } },
          },
        });
        if (activeAdminCount <= 1) {
          throw new ConflictException('The last active administrator cannot be removed');
        }
      }

      return tx.user.update({
        where: { id },
        data: {
          status: 'inactive',
          deletedAt: now,
          deletedReason: reason?.trim() ? reason.trim() : null,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          practiceId: true,
          status: true,
          createdAt: true,
          deletedAt: true,
          deletedReason: true,
        },
      });
    });

    await this.sessionService.revokeAllUserSessions(id, 'user_removed');
    return removed;
  }
}
