import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { TreatmentsService } from './treatments.service';

@Controller('treatments')
export class TreatmentsController {
  constructor(private readonly treatmentsService: TreatmentsService) {}

  @Get('patient/:patientId')
  findByPatient(@Param('patientId') patientId: string, @Query() query: any) {
    return this.treatmentsService.findByPatientId(patientId, query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.treatmentsService.findById(id);
  }

  @Post()
  create(@Body() dto: any) {
    return this.treatmentsService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.treatmentsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.treatmentsService.remove(id);
  }
}
