import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { PatientsRepository } from './patients.repository';

@Controller('patients')
export class PatientsController {
  private readonly patientsService: PatientsService;

  constructor(patientsService?: PatientsService) {
    this.patientsService = patientsService ?? new PatientsService(new PatientsRepository());
  }

  @Get()
  findAll(@Query() query: any) {
    return this.patientsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.patientsService.findById(id);
  }

  @Post()
  create(@Body() dto: any) {
    return this.patientsService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.patientsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.patientsService.remove(id);
  }
}
