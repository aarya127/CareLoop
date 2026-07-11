import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import { EmrService } from './emr.service';
import { CreatePeriodontalExamDto, UpsertToothChartEntryDto, type EmrActor } from './dto';
import { CurrentUser } from '../../common/decorators';
import { RequireRole } from '../../common/guards';
import { EMR_CLINICAL_ROLES } from '../auth/auth.constants';

/**
 * EMR dental charting: per-tooth chart entries and periodontal exams.
 * Reads require a session; writes require a clinical role.
 */
@Controller()
export class ChartingController {
  constructor(@Inject(EmrService) private readonly emr: EmrService) {}

  // ── Tooth chart ────────────────────────────────────────────────────────
  @Get('patients/:patientId/tooth-chart')
  getToothChart(@CurrentUser() actor: EmrActor, @Param('patientId') patientId: string) {
    return this.emr.getToothChart(actor, patientId);
  }

  @Put('patients/:patientId/tooth-chart/:toothNumber')
  @RequireRole(...EMR_CLINICAL_ROLES)
  upsertToothEntry(
    @CurrentUser() actor: EmrActor,
    @Param('patientId') patientId: string,
    @Param('toothNumber', ParseIntPipe) toothNumber: number,
    @Body() dto: UpsertToothChartEntryDto,
  ) {
    return this.emr.upsertToothEntry(actor, patientId, toothNumber, dto);
  }

  // ── Periodontal exams ──────────────────────────────────────────────────
  @Get('patients/:patientId/periodontal-exams')
  listPeriodontalExams(@CurrentUser() actor: EmrActor, @Param('patientId') patientId: string) {
    return this.emr.listPeriodontalExams(actor, patientId);
  }

  @Post('patients/:patientId/periodontal-exams')
  @HttpCode(HttpStatus.CREATED)
  @RequireRole(...EMR_CLINICAL_ROLES)
  createPeriodontalExam(
    @CurrentUser() actor: EmrActor,
    @Param('patientId') patientId: string,
    @Body() dto: CreatePeriodontalExamDto,
  ) {
    return this.emr.createPeriodontalExam(actor, patientId, dto);
  }

  @Get('periodontal-exams/:id')
  getPeriodontalExam(@CurrentUser() actor: EmrActor, @Param('id') id: string) {
    return this.emr.getPeriodontalExam(actor, id);
  }
}
