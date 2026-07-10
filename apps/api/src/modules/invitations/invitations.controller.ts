import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { InvitationsService } from './invitations.service';
import { AcceptInvitationDto, CreateInvitationDto } from './dto';
import { RequireRole } from '../../common/guards';
import { Public } from '../../common/decorators';
import { MANAGEMENT_ROLES } from '../auth/auth.constants';

@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitations: InvitationsService) {}

  /** Create an invite (admin/manager). Returns the shareable accept link. */
  @Post()
  @RequireRole(...MANAGEMENT_ROLES)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateInvitationDto, @Req() req: any) {
    return this.invitations.create(req.user.practiceId, req.user.id, dto);
  }

  /** List pending invites for the caller's practice (admin/manager). */
  @Get()
  @RequireRole(...MANAGEMENT_ROLES)
  list(@Req() req: any) {
    return this.invitations.list(req.user.practiceId);
  }

  /** Revoke a pending invite (admin/manager, tenant-scoped). */
  @Post(':id/revoke')
  @RequireRole(...MANAGEMENT_ROLES)
  @HttpCode(HttpStatus.OK)
  revoke(@Param('id') id: string, @Req() req: any) {
    return this.invitations.revoke(req.user.practiceId, id);
  }

  /** Public: preview an invite (email/role/practice) before accepting. */
  @Public()
  @Get('accept/:token')
  preview(@Param('token') token: string) {
    return this.invitations.preview(token);
  }

  /** Public: accept an invite — creates the user + a session. Rate-limited. */
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('accept/:token')
  @HttpCode(HttpStatus.CREATED)
  accept(@Param('token') token: string, @Body() dto: AcceptInvitationDto, @Req() req: any) {
    return this.invitations.accept(token, dto, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }
}
