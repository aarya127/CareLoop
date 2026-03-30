import { Controller, Get, Post, Put, Delete, Param, Body, Query, BadRequestException } from '@nestjs/common';
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

  @Get(':id/medical-history')
  async getMedicalHistory(@Param('id') id: string) {
    const history = await this.patientsService.findMedicalHistory(id);
    if (!history) {
      return null;
    }
    return history;
  }

  @Put(':id/medical-history')
  async updateMedicalHistory(@Param('id') id: string, @Body() dto: any) {
    const updated = await this.patientsService.upsertMedicalHistory(id, dto);
    if (!updated) {
      throw new BadRequestException('Unable to update patient medical history');
    }
    return updated;
  }

  @Post()
  async create(@Body() dto: any) {
    const created = await this.patientsService.create(dto);
    if (!created) {
      throw new BadRequestException('Unable to create patient');
    }
    return created;
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: any) {
    const updated = await this.patientsService.update(id, dto);
    if (!updated) {
      throw new BadRequestException('Unable to update patient');
    }
    return updated;
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.patientsService.remove(id);
  }
}
