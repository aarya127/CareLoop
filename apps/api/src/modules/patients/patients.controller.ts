import { Controller, Get, Post, Put, Delete, Param, Body, Query, Req, BadRequestException, NotFoundException } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { RequireRole } from '../../common/guards';
import { MANAGEMENT_ROLES } from '../auth/auth.constants';

@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get()
  findAll(@Query() query: any, @Req() req: any) {
    return this.patientsService.findAll(req.user.practiceId, query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    // findById returns null for a missing OR cross-tenant record — surface a 404
    // (not a 200-with-null) so semantics match the other modules and no resource
    // existence is implied for another practice's records.
    const patient = await this.patientsService.findById(req.user.practiceId, id, req.user.id);
    if (!patient) throw new NotFoundException(`Patient ${id} not found`);
    return patient;
  }

  @Get(':id/medical-history')
  async getMedicalHistory(@Param('id') id: string, @Req() req: any) {
    const history = await this.patientsService.findMedicalHistory(req.user.practiceId, id);
    if (!history) {
      return null;
    }
    return history;
  }

  @Put(':id/medical-history')
  async updateMedicalHistory(@Param('id') id: string, @Body() dto: any, @Req() req: any) {
    const updated = await this.patientsService.upsertMedicalHistory(req.user.practiceId, id, dto);
    if (!updated) {
      throw new BadRequestException('Unable to update patient medical history');
    }
    return updated;
  }

  @Get(':id/record-section/:section')
  async getRecordSection(@Param('id') id: string, @Param('section') section: string, @Req() req: any) {
    return this.patientsService.findRecordSection(req.user.practiceId, id, section);
  }

  @Put(':id/record-section/:section')
  async updateRecordSection(
    @Param('id') id: string,
    @Param('section') section: string,
    @Body() dto: any,
    @Req() req: any,
  ) {
    const updated = await this.patientsService.upsertRecordSection(req.user.practiceId, id, section, dto);
    if (!updated) {
      throw new BadRequestException(`Unable to update patient record section: ${section}`);
    }
    return updated;
  }

  @Post()
  async create(@Body() dto: any, @Req() req: any) {
    const created = await this.patientsService.create(req.user.practiceId, dto, req.user.id);
    if (!created) {
      throw new BadRequestException('Unable to create patient');
    }
    return created;
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: any, @Req() req: any) {
    const updated = await this.patientsService.update(req.user.practiceId, id, dto, req.user.id);
    if (!updated) {
      throw new BadRequestException('Unable to update patient');
    }
    return updated;
  }

  @Delete(':id')
  @RequireRole(...MANAGEMENT_ROLES) // destructive — admin/manager only
  remove(@Param('id') id: string, @Req() req: any) {
    return this.patientsService.remove(req.user.practiceId, id, req.user.id);
  }
}
