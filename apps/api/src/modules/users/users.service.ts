import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@careloop/db';

@Injectable()
export class UsersService {
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

  async update(practiceId: string, id: string, dto: any): Promise<any> {
    const user = await prisma.user.findFirst({ where: { id, practiceId }, select: { id: true } });
    if (!user) throw new NotFoundException('User not found');

    return prisma.user.update({
      where: { id },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
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

  async remove(practiceId: string, id: string, reason?: string): Promise<any> {
    const user = await prisma.user.findFirst({ where: { id, practiceId }, select: { id: true } });
    if (!user) throw new NotFoundException('User not found');

    const now = new Date();
    await prisma.session.updateMany({
      where: { userId: id, revokedAt: null },
      data: { revokedAt: now, revokeReason: 'user_removed' },
    });

    return prisma.user.update({
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
  }
}
