import { Controller, Get, Post, Put, Delete, Param, Body, Query, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { InsuranceService } from './insurance.service';
import { RequireRole } from '../../common/guards';
import { FRONT_OFFICE_ROLES, MANAGEMENT_ROLES } from '../auth/auth.constants';
import {
  CoverageSummaryDto,
  CreateInsuranceDto,
  LookupInsuranceDto,
  UpdateInsuranceDto,
} from './dto';

@Controller('insurance')
export class InsuranceController {
  constructor(private readonly insuranceService: InsuranceService) {}

  // Reads stay open (clinicians need to see coverage); writes are front-office.
  @Get('patient/:patientId')
  findByPatient(@Param('patientId') patientId: string, @Req() req: any) {
    return this.insuranceService.findByPatientId(req.user.practiceId, patientId);
  }

  /** Structured coverage + remaining benefit for a patient's active plan. */
  @Get(':patientId/coverage')
  getCoverage(@Param('patientId') patientId: string, @Req() req: any) {
    return this.insuranceService.getCoverage(req.user.practiceId, patientId);
  }

  /** Set structured coverage on an insurance record and mark it verified. */
  @Put(':id/coverage')
  @RequireRole(...FRONT_OFFICE_ROLES)
  updateCoverage(@Param('id') id: string, @Body() dto: CoverageSummaryDto, @Req() req: any) {
    return this.insuranceService.updateCoverage(req.user.practiceId, id, dto);
  }

  @Get('lookup')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  findByMemberId(@Query() query: LookupInsuranceDto, @Req() req: any) {
    return this.insuranceService.findByMemberId(req.user.practiceId, query.memberId);
  }

  @Post()
  @RequireRole(...FRONT_OFFICE_ROLES)
  create(@Body() dto: CreateInsuranceDto, @Req() req: any) {
    return this.insuranceService.create(req.user.practiceId, dto);
  }

  @Put(':id')
  @RequireRole(...FRONT_OFFICE_ROLES)
  update(@Param('id') id: string, @Body() dto: UpdateInsuranceDto, @Req() req: any) {
    return this.insuranceService.update(req.user.practiceId, id, dto);
  }

  @Delete(':id')
  @RequireRole(...MANAGEMENT_ROLES) // destructive — admin/manager only
  remove(@Param('id') id: string, @Req() req: any) {
    return this.insuranceService.remove(req.user.practiceId, id);
  }
}
