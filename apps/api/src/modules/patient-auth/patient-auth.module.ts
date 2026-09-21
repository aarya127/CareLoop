import { Module } from '@nestjs/common';
import { MessagingModule } from '../messaging/messaging.module';
import { PatientAuthController } from './patient-auth.controller';
import { PatientAuthService } from './patient-auth.service';
import { PatientSessionService } from './patient-session.service';
import { PatientAuthGuard } from './patient-auth.guard';

@Module({
  imports: [MessagingModule],
  controllers: [PatientAuthController],
  providers: [PatientAuthService, PatientSessionService, PatientAuthGuard],
})
export class PatientAuthModule {}
