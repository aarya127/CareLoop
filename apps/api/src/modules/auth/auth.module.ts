import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SessionService } from './session.service';
import { AuthGuard, RolesGuard, ServiceAccountGuard } from '../../common/guards';

@Module({
  controllers: [AuthController],
  providers: [AuthService, SessionService, AuthGuard, RolesGuard, ServiceAccountGuard],
  exports: [AuthService, SessionService, AuthGuard, RolesGuard, ServiceAccountGuard],
})
export class AuthModule {}
