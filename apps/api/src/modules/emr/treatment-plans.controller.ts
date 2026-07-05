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
  CreateTreatmentPlanDto,
  TreatmentPlanItemInputDto,
  UpdateTreatmentPlanDto,
  UpdateTreatmentPlanItemDto,
  type EmrActor,
} from './dto';
import { CurrentUser } from '../../common/decorators';
import { RequireRole } from '../../common/guards';
import { EMR_CLINICAL_ROLES } from '../auth/auth.constants';

/**
 * Treatment plans: grouped planned procedures with running estimate + acceptance.
 * Reads require a session; writes require a clinical role.
 */
@Controller()
export class TreatmentPlansController {
  constructor(@Inject(EmrService) private readonly emr: EmrService) {}

  @Get('patients/:patientId/treatment-plans')
  list(@CurrentUser() actor: EmrActor, @Param('patientId') patientId: string) {
    return this.emr.listTreatmentPlans(actor, patientId);
  }

  @Post('patients/:patientId/treatment-plans')
  @HttpCode(HttpStatus.CREATED)
  @RequireRole(...EMR_CLINICAL_ROLES)
  create(
    @CurrentUser() actor: EmrActor,
    @Param('patientId') patientId: string,
    @Body() dto: CreateTreatmentPlanDto,
  ) {
    return this.emr.createTreatmentPlan(actor, patientId, dto);
  }

  @Get('treatment-plans/:id')
  get(@CurrentUser() actor: EmrActor, @Param('id') id: string) {
    return this.emr.getTreatmentPlan(actor, id);
  }

  @Put('treatment-plans/:id')
  @RequireRole(...EMR_CLINICAL_ROLES)
  update(
    @CurrentUser() actor: EmrActor,
    @Param('id') id: string,
    @Body() dto: UpdateTreatmentPlanDto,
  ) {
    return this.emr.updateTreatmentPlan(actor, id, dto);
  }

  @Post('treatment-plans/:id/accept')
  @HttpCode(HttpStatus.OK)
  @RequireRole(...EMR_CLINICAL_ROLES)
  accept(@CurrentUser() actor: EmrActor, @Param('id') id: string) {
    return this.emr.acceptTreatmentPlan(actor, id);
  }

  // ── Items ────────────────────────────────────────────────────────────────
  @Post('treatment-plans/:id/items')
  @HttpCode(HttpStatus.CREATED)
  @RequireRole(...EMR_CLINICAL_ROLES)
  addItem(
    @CurrentUser() actor: EmrActor,
    @Param('id') id: string,
    @Body() dto: TreatmentPlanItemInputDto,
  ) {
    return this.emr.addPlanItem(actor, id, dto);
  }

  @Put('treatment-plan-items/:itemId')
  @RequireRole(...EMR_CLINICAL_ROLES)
  updateItem(
    @CurrentUser() actor: EmrActor,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateTreatmentPlanItemDto,
  ) {
    return this.emr.updatePlanItem(actor, itemId, dto);
  }

  @Delete('treatment-plan-items/:itemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequireRole(...EMR_CLINICAL_ROLES)
  deleteItem(@CurrentUser() actor: EmrActor, @Param('itemId') itemId: string) {
    return this.emr.deletePlanItem(actor, itemId);
  }
}
