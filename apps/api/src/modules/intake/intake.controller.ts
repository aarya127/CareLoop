import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  Headers,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { IntakeService } from './intake.service';
import { Public } from '../../common/decorators';
import { RequireRole } from '../../common/guards';
import { MANAGEMENT_ROLES } from '../auth/auth.constants';

/**
 * Intake draft API.
 *
 * All /intake/drafts/* routes are @Public so patients can fill forms
 * without a staff session.  Staff-facing routes can be added under a
 * separate /intake (guarded) prefix later.
 */
@Controller('intake')
export class IntakeController {
  constructor(private readonly intakeService: IntakeService) {}

  // ── Draft lifecycle ────────────────────────────────────────────────────────

  /** Create a signed public link for the authenticated practice. */
  @Post('links')
  @RequireRole(...MANAGEMENT_ROLES)
  createLink(@Req() req: { user: { practiceId: string } }) {
    return this.intakeService.createPracticeLink(req.user.practiceId);
  }

  /** POST /intake/drafts — exchange a signed practice link for a blank draft */
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('drafts')
  createDraft(@Body() body: any) {
    return this.intakeService.createDraftFromLink(String(body?.linkToken ?? ''));
  }

  /** GET /intake/drafts/:id — fetch a draft */
  @Public()
  @Get('drafts/:id')
  findDraft(@Param('id') id: string, @Headers('x-intake-token') accessToken: string) {
    return this.intakeService.findDraft(id, accessToken);
  }

  /** PATCH /intake/drafts/:id — partial-update (auto-save) one or more sections */
  @Public()
  @Throttle({ default: { limit: 120, ttl: 60000 } })
  @Patch('drafts/:id')
  updateDraft(
    @Param('id') id: string,
    @Headers('x-intake-token') accessToken: string,
    @Body() dto: any,
  ) {
    return this.intakeService.updateDraft(id, accessToken, dto);
  }

  /**
   * POST /intake/drafts/:id/submit
   *
   * Requires an `Idempotency-Key` header.  On first call:
   *   • validates form data
   *   • creates Patient, PatientInsurance, IntakeSubmission
   *   • marks draft submitted
   * On replay: returns the cached result immediately (idempotent).
   */
  @Public()
  @Post('drafts/:id/submit')
  submitDraft(
    @Param('id') id: string,
    @Headers('x-intake-token') accessToken: string,
    @Headers('idempotency-key') idempotencyKey: string,
  ) {
    if (!idempotencyKey?.trim()) {
      throw new BadRequestException('Idempotency-Key header is required');
    }
    return this.intakeService.submitDraft(id, accessToken, idempotencyKey);
  }

  // ── Legacy shims (keep existing routes working) ────────────────────────────

  @Post()
  create(@Req() req: { user: { practiceId: string; id: string } }) {
    return this.intakeService.createDraft({ practiceId: req.user.practiceId }, req.user.id);
  }

  @Get(':id')
  findOne(@Req() req: { user: { practiceId: string } }, @Param('id') id: string) {
    return this.intakeService.findById(req.user.practiceId, id);
  }
}
