import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { EmrService } from './emr.service';
import {
  CreateAllergyDto,
  CreateConditionDto,
  CreateMedicationDto,
  UpdateAllergyDto,
  UpdateConditionDto,
  UpdateMedicationDto,
  type EmrActor,
} from './dto';
import { CurrentUser } from '../../common/decorators';
import { RequireRole } from '../../common/guards';
import { EMR_CLINICAL_ROLES } from '../auth/auth.constants';

/**
 * EMR medical summary: allergies, medications, and problem-list conditions.
 * Reads require a session; writes require a clinical role.
 */
@Controller()
export class MedicalHistoryController {
  constructor(@Inject(EmrService) private readonly emr: EmrService) {}

  // ── Allergies ──────────────────────────────────────────────────────────
  @Get('patients/:patientId/allergies')
  listAllergies(@CurrentUser() actor: EmrActor, @Param('patientId') patientId: string) {
    return this.emr.listAllergies(actor, patientId);
  }

  @Post('patients/:patientId/allergies')
  @HttpCode(HttpStatus.CREATED)
  @RequireRole(...EMR_CLINICAL_ROLES)
  createAllergy(
    @CurrentUser() actor: EmrActor,
    @Param('patientId') patientId: string,
    @Body() dto: CreateAllergyDto,
  ) {
    return this.emr.createAllergy(actor, patientId, dto);
  }

  @Put('allergies/:id')
  @RequireRole(...EMR_CLINICAL_ROLES)
  updateAllergy(
    @CurrentUser() actor: EmrActor,
    @Param('id') id: string,
    @Body() dto: UpdateAllergyDto,
  ) {
    return this.emr.updateAllergy(actor, id, dto);
  }

  @Delete('allergies/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequireRole(...EMR_CLINICAL_ROLES)
  deleteAllergy(@CurrentUser() actor: EmrActor, @Param('id') id: string) {
    return this.emr.deleteAllergy(actor, id);
  }

  // ── Medications ────────────────────────────────────────────────────────
  @Get('patients/:patientId/medications')
  listMedications(@CurrentUser() actor: EmrActor, @Param('patientId') patientId: string) {
    return this.emr.listMedications(actor, patientId);
  }

  @Post('patients/:patientId/medications')
  @HttpCode(HttpStatus.CREATED)
  @RequireRole(...EMR_CLINICAL_ROLES)
  createMedication(
    @CurrentUser() actor: EmrActor,
    @Param('patientId') patientId: string,
    @Body() dto: CreateMedicationDto,
  ) {
    return this.emr.createMedication(actor, patientId, dto);
  }

  @Put('medications/:id')
  @RequireRole(...EMR_CLINICAL_ROLES)
  updateMedication(
    @CurrentUser() actor: EmrActor,
    @Param('id') id: string,
    @Body() dto: UpdateMedicationDto,
  ) {
    return this.emr.updateMedication(actor, id, dto);
  }

  @Delete('medications/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequireRole(...EMR_CLINICAL_ROLES)
  deleteMedication(@CurrentUser() actor: EmrActor, @Param('id') id: string) {
    return this.emr.deleteMedication(actor, id);
  }

  // ── Conditions (problem list) ──────────────────────────────────────────
  @Get('patients/:patientId/conditions')
  listConditions(@CurrentUser() actor: EmrActor, @Param('patientId') patientId: string) {
    return this.emr.listConditions(actor, patientId);
  }

  @Post('patients/:patientId/conditions')
  @HttpCode(HttpStatus.CREATED)
  @RequireRole(...EMR_CLINICAL_ROLES)
  createCondition(
    @CurrentUser() actor: EmrActor,
    @Param('patientId') patientId: string,
    @Body() dto: CreateConditionDto,
  ) {
    return this.emr.createCondition(actor, patientId, dto);
  }

  @Put('conditions/:id')
  @RequireRole(...EMR_CLINICAL_ROLES)
  updateCondition(
    @CurrentUser() actor: EmrActor,
    @Param('id') id: string,
    @Body() dto: UpdateConditionDto,
  ) {
    return this.emr.updateCondition(actor, id, dto);
  }

  @Delete('conditions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequireRole(...EMR_CLINICAL_ROLES)
  deleteCondition(@CurrentUser() actor: EmrActor, @Param('id') id: string) {
    return this.emr.deleteCondition(actor, id);
  }
}
