import { Controller, Get, Query, Req } from '@nestjs/common';
import { AuditService } from './audit.service';
import { RequireRole } from '../../common/guards';
import { MANAGEMENT_ROLES } from '../auth/auth.constants';
import { AuditLogQueryDto } from './audit-query.dto';

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
  getLog(@Req() req: { user: { practiceId: string } }, @Query() query: AuditLogQueryDto) {
    return this.auditService.getLog(req.user.practiceId, query);
  }
}
