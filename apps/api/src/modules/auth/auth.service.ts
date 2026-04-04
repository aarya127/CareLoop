import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { PasswordService } from './password.service';
import { SessionService } from './session.service';
import { prisma } from '../../config/database';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  practiceId: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly passwordService: PasswordService,
    private readonly sessionService: SessionService,
  ) {}

  async login(
    dto: LoginDto,
    meta: { ipAddress?: string; userAgent?: string } = {},
  ): Promise<{ sessionToken: string; user: AuthUser }> {
    // Look up by lowercase email — constant-time comparison handled by argon2
    const user = await prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    // Always run hash verify to prevent timing attacks even when user not found
    const dummyHash =
      '$argon2id$v=19$m=65536,t=3,p=4$dummysalt$dummyhash';
    const hashToCheck = user?.passwordHash ?? dummyHash;
    const valid = await this.passwordService.verify(hashToCheck, dto.password);

    if (!user || !user.passwordHash || !valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is disabled');
    }

    const sessionToken = await this.sessionService.create(user.id, meta);

    return {
      sessionToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        practiceId: user.practiceId,
      },
    };
  }

  async logout(sessionToken: string): Promise<void> {
    await this.sessionService.revoke(sessionToken);
  }

  async validateSession(token: string) {
    return this.sessionService.validate(token);
  }

  async me(token: string): Promise<AuthUser | null> {
    const session = await this.sessionService.validate(token);
    if (!session) return null;
    const { user } = session;
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      practiceId: user.practiceId,
    };
  }

  async register(dto: RegisterDto): Promise<{ userId: string }> {
    const existing = await prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });
    if (existing) throw new ConflictException('Email already in use');

    const passwordHash = await this.passwordService.hash(dto.password);
    const user = await prisma.user.create({
      data: {
        email: dto.email.toLowerCase().trim(),
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: (dto.role as any) ?? 'STAFF',
        practiceId: dto.practiceId,
      },
    });

    return { userId: user.id };
  }
}
