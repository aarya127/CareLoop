import { Controller, Get, Post, Put, Delete, Param, Body, Query, Req } from '@nestjs/common';
import { InsuranceService } from './insurance.service';

@Controller('insurance')
export class InsuranceController {
  constructor(private readonly insuranceService: InsuranceService) {}

  @Get('patient/:patientId')
  findByPatient(@Param('patientId') patientId: string, @Req() req: any) {
    return this.insuranceService.findByPatientId(req.user.practiceId, patientId);
  }

  @Get('lookup')
  findByMemberId(@Query('memberId') memberId: string, @Req() req: any) {
    return this.insuranceService.findByMemberId(req.user.practiceId, memberId);
  }

  @Post()
  create(@Body() dto: any, @Req() req: any) {
    return this.insuranceService.create(req.user.practiceId, dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: any, @Req() req: any) {
    return this.insuranceService.update(req.user.practiceId, id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.insuranceService.remove(req.user.practiceId, id);
  }
}
