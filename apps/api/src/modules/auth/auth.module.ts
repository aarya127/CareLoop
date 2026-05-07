import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
<<<<<<< HEAD
import { SessionService } from './session.service';
import { AuthGuard, RolesGuard, ServiceAccountGuard } from '../../common/guards';

@Module({
  controllers: [AuthController],
  providers: [AuthService, SessionService, AuthGuard, RolesGuard, ServiceAccountGuard],
  exports: [AuthService, SessionService, AuthGuard, RolesGuard, ServiceAccountGuard],
=======
import { PasswordService } from './password.service';
import { SessionService } from './session.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, PasswordService, SessionService],
  exports: [AuthService, SessionService],
>>>>>>> auth
})
export class AuthModule {}
