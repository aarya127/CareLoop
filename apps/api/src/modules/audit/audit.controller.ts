import { Controller, Get, Query } from '@nestjs/common';
import { AuditService, type AuditLogQuery } from './audit.service';
import { RequireRole } from '../../common/guards';
import { MANAGEMENT_ROLES } from '../auth/auth.constants';

// Compliance audit trail — management only.
@Controller('audit')
@RequireRole(...MANAGEMENT_ROLES)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  /**
   * GET /audit
   * Query params: eventType, outcome, actorUserId, targetUserId, from, to, limit, offset.
   * Returns paginated audit log rows + total count.
   * Results cached 30s in Redis.
   */
  @Get()
  getLog(
    @Query('eventType') eventType?: string,
    @Query('outcome') outcome?: string,
    @Query('actorUserId') actorUserId?: string,
    @Query('targetUserId') targetUserId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const query: AuditLogQuery = {
      eventType,
      outcome,
      actorUserId,
      targetUserId,
      from,
      to,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    };
    return this.auditService.getLog(query);
  }
}
