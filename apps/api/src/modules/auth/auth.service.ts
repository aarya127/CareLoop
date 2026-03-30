import { Injectable } from '@nestjs/common';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  async login(_dto: LoginDto): Promise<{ accessToken: string; refreshToken: string }> {
    throw new Error('Not implemented');
  }

  async register(_dto: RegisterDto): Promise<{ userId: string }> {
    throw new Error('Not implemented');
  }

  async logout(_sessionId?: string): Promise<void> {
    throw new Error('Not implemented');
  }

  async refresh(_token: string): Promise<{ accessToken: string }> {
    throw new Error('Not implemented');
  }
}
