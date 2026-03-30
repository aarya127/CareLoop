import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  findAll(@Query() query: any) {
    return this.appointmentsService.findAll(query);
  }

  @Get('availability')
  getAvailability(@Query() query: any) {
    return this.appointmentsService.getAvailability(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.appointmentsService.findById(id);
  }

  @Post()
  create(@Body() dto: any) {
    return this.appointmentsService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.appointmentsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.appointmentsService.remove(id);
  }
}
