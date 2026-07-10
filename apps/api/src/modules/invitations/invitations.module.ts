import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';

// SessionService comes from the @Global AuthModule; AuditService from AuditModule.
@Module({
  imports: [AuditModule],
  controllers: [InvitationsController],
  providers: [InvitationsService],
})
export class InvitationsModule {}
