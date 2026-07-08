import { Controller, Get, Post, Put, Delete, Param, Body, Query, Req } from '@nestjs/common';
import { InsuranceService } from './insurance.service';
import { RequireRole } from '../../common/guards';
import { FRONT_OFFICE_ROLES, MANAGEMENT_ROLES } from '../auth/auth.constants';

@Controller('insurance')
export class InsuranceController {
  constructor(private readonly insuranceService: InsuranceService) {}

  // Reads stay open (clinicians need to see coverage); writes are front-office.
  @Get('patient/:patientId')
  findByPatient(@Param('patientId') patientId: string, @Req() req: any) {
    return this.insuranceService.findByPatientId(req.user.practiceId, patientId);
  }

  @Get('lookup')
  findByMemberId(@Query('memberId') memberId: string, @Req() req: any) {
    return this.insuranceService.findByMemberId(req.user.practiceId, memberId);
  }

  @Post()
  @RequireRole(...FRONT_OFFICE_ROLES)
  create(@Body() dto: any, @Req() req: any) {
    return this.insuranceService.create(req.user.practiceId, dto);
  }

  @Put(':id')
  @RequireRole(...FRONT_OFFICE_ROLES)
  update(@Param('id') id: string, @Body() dto: any, @Req() req: any) {
    return this.insuranceService.update(req.user.practiceId, id, dto);
  }

  @Delete(':id')
  @RequireRole(...MANAGEMENT_ROLES) // destructive — admin/manager only
  remove(@Param('id') id: string, @Req() req: any) {
    return this.insuranceService.remove(req.user.practiceId, id);
  }
}
