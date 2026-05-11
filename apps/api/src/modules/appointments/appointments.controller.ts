import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import type {
  CreateAppointmentDto,
  RescheduleDto,
  CancelDto,
  GetSlotsDto,
} from './dto';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  /** GET /appointments?practiceId=&providerId=&patientId=&from=&to=&status= */
  @Get()
  findAll(@Query() query: any) {
    return this.appointmentsService.findAll(query);
  }

  /** GET /appointments/availability?practiceId=&providerId=&date=YYYY-MM-DD&duration=30 */
  @Get('availability')
  getAvailability(@Query() query: GetSlotsDto) {
    return this.appointmentsService.getAvailability(query);
  }

  /** GET /appointments/:id */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.appointmentsService.findById(id);
  }

  /** POST /appointments  (supports Idempotency-Key header) */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() dto: CreateAppointmentDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.appointmentsService.create(dto, idempotencyKey);
  }

  /** PATCH /appointments/:id/reschedule */
  @Patch(':id/reschedule')
  reschedule(@Param('id') id: string, @Body() dto: RescheduleDto) {
    return this.appointmentsService.reschedule(id, dto);
  }

  /** PATCH /appointments/:id/cancel */
  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  cancel(@Param('id') id: string, @Body() dto: CancelDto) {
    return this.appointmentsService.cancel(id, dto);
  }

  /** DELETE /appointments/:id  (alias for cancel) */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.appointmentsService.cancel(id, {});
  }
}
