import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { MessagingModule } from '../messaging/messaging.module';
import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';

// SessionService comes from the @Global AuthModule; AuditService from AuditModule;
// EmailService from MessagingModule (for sending the invite email).
@Module({
  imports: [AuditModule, MessagingModule],
  controllers: [InvitationsController],
  providers: [InvitationsService],
})
export class InvitationsModule {}
