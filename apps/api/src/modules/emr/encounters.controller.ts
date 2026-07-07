import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { EmrService } from './emr.service';
import {
  CreateEncounterDto,
  DraftFromTranscriptDto,
  UpdateEncounterDto,
  type EmrActor,
} from './dto';
import { CurrentUser } from '../../common/decorators';
import { RequireRole } from '../../common/guards';
import { EMR_CLINICAL_ROLES } from '../auth/auth.constants';

/**
 * EMR encounters (SOAP visit notes). Reads require an authenticated session;
 * writes require a clinical role. Tenancy + author come from the session.
 */
@Controller()
export class EncountersController {
  constructor(@Inject(EmrService) private readonly emr: EmrService) {}

  @Get('patients/:patientId/encounters')
  list(@CurrentUser() actor: EmrActor, @Param('patientId') patientId: string) {
    return this.emr.listEncounters(actor, patientId);
  }

  /** Chronological clinical activity feed (encounters + treatments + docs + appts). */
  @Get('patients/:patientId/timeline')
  timeline(@CurrentUser() actor: EmrActor, @Param('patientId') patientId: string) {
    return this.emr.getTimeline(actor, patientId);
  }

  @Post('patients/:patientId/encounters')
  @HttpCode(HttpStatus.CREATED)
  @RequireRole(...EMR_CLINICAL_ROLES)
  create(
    @CurrentUser() actor: EmrActor,
    @Param('patientId') patientId: string,
    @Body() dto: CreateEncounterDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.emr.createEncounter(actor, patientId, dto, idempotencyKey);
  }

  @Get('encounters/:id')
  get(@CurrentUser() actor: EmrActor, @Param('id') id: string) {
    return this.emr.getEncounter(actor, id);
  }

  @Put('encounters/:id')
  @RequireRole(...EMR_CLINICAL_ROLES)
  update(
    @CurrentUser() actor: EmrActor,
    @Param('id') id: string,
    @Body() dto: UpdateEncounterDto,
  ) {
    return this.emr.updateEncounter(actor, id, dto);
  }

  @Post('encounters/:id/sign')
  @HttpCode(HttpStatus.OK)
  @RequireRole(...EMR_CLINICAL_ROLES)
  sign(@CurrentUser() actor: EmrActor, @Param('id') id: string) {
    return this.emr.signEncounter(actor, id);
  }
}
