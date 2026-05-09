import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { InsuranceService } from './insurance.service';

@Controller('insurance')
export class InsuranceController {
  constructor(private readonly insuranceService: InsuranceService) {}

  @Get('patient/:patientId')
  findByPatient(@Param('patientId') patientId: string) {
    return this.insuranceService.findByPatientId(patientId);
  }

  @Get('lookup')
  findByMemberId(@Query('memberId') memberId: string) {
    return this.insuranceService.findByMemberId(memberId);
  }

  @Post()
  create(@Body() dto: any) {
    return this.insuranceService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.insuranceService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.insuranceService.remove(id);
  }
}
