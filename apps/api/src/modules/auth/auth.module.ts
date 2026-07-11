import { Global, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';
import { SessionService } from './session.service';
import { AuthGuard, RolesGuard, ServiceAccountGuard } from '../../common/guards';

@Global()
@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    PasswordService,
    SessionService,
    AuthGuard,
    RolesGuard,
    ServiceAccountGuard,
  ],
  exports: [AuthService, SessionService, AuthGuard, RolesGuard, ServiceAccountGuard],
})
export class AuthModule {}
