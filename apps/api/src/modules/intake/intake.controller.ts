import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import { IntakeService } from './intake.service';
import { Public } from '../../common/decorators';

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

  /** POST /intake/drafts — create a new blank draft */
  @Public()
  @Post('drafts')
  createDraft(@Body() body: any) {
    return this.intakeService.createDraft({
      practiceId: String(body?.practiceId ?? 'demo-practice'),
    });
  }

  /** GET /intake/drafts/:id — fetch a draft */
  @Public()
  @Get('drafts/:id')
  findDraft(@Param('id') id: string) {
    return this.intakeService.findDraft(id);
  }

  /** PATCH /intake/drafts/:id — partial-update (auto-save) one or more sections */
  @Public()
  @Patch('drafts/:id')
  updateDraft(@Param('id') id: string, @Body() dto: any) {
    return this.intakeService.updateDraft(id, dto);
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
    @Headers('idempotency-key') idempotencyKey: string,
  ) {
    if (!idempotencyKey?.trim()) {
      throw new BadRequestException('Idempotency-Key header is required');
    }
    return this.intakeService.submitDraft(id, idempotencyKey);
  }

  // ── Legacy shims (keep existing routes working) ────────────────────────────

  @Post()
  create(@Body() dto: any) {
    return this.intakeService.create(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.intakeService.findById(id);
  }
}
