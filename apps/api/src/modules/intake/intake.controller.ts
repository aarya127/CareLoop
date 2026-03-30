import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { IntakeService } from './intake.service';

@Controller('intake')
export class IntakeController {
  constructor(private readonly intakeService: IntakeService) {}

  @Post()
  create(@Body() dto: any) {
    return this.intakeService.create(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.intakeService.findById(id);
  }
}
