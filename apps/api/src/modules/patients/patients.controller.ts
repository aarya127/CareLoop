import { Controller, Get, Post, Put, Delete, Param, Body, Query, Req, BadRequestException } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { PatientsRepository } from './patients.repository';

@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get()
  findAll(@Query() query: any) {
    return this.patientsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.patientsService.findById(id, (req as any).user?.id);
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

  @Get(':id/record-section/:section')
  async getRecordSection(@Param('id') id: string, @Param('section') section: string) {
    return this.patientsService.findRecordSection(id, section);
  }

  @Put(':id/record-section/:section')
  async updateRecordSection(
    @Param('id') id: string,
    @Param('section') section: string,
    @Body() dto: any
  ) {
    const updated = await this.patientsService.upsertRecordSection(id, section, dto);
    if (!updated) {
      throw new BadRequestException(`Unable to update patient record section: ${section}`);
    }
    return updated;
  }

  @Post()
  async create(@Body() dto: any, @Req() req: any) {
    const created = await this.patientsService.create(dto, (req as any).user?.id);
    if (!created) {
      throw new BadRequestException('Unable to create patient');
    }
    return created;
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: any, @Req() req: any) {
    const updated = await this.patientsService.update(id, dto, (req as any).user?.id);
    if (!updated) {
      throw new BadRequestException('Unable to update patient');
    }
    return updated;
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.patientsService.remove(id, (req as any).user?.id);
  }
}
