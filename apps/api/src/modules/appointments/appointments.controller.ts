import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Req,
  Res,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { APPT_EVENTS_CHANNEL } from './appointments.service';
import { getRedisClient } from '../../config/redis';
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

  /**
   * GET /appointments/events?practiceId=
   *
   * Server-Sent Events endpoint for the live appointment board.
   * Streams Redis pub/sub messages for the practice to the browser.
   * The client uses the native EventSource API (no library needed).
   *
   * Works across multiple API replicas because events flow through Redis.
   * The connection is long-lived; nginx must have proxy_read_timeout >= 90s
   * and X-Accel-Buffering: no to prevent response buffering.
   */
  @Get('events')
  async streamEvents(
    @Req() req: any,
    @Res() reply: any,
    @Query('practiceId') practiceId: string,
  ): Promise<void> {
    const res: import('http').ServerResponse = reply.raw;

    res.writeHead(200, {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection':    'keep-alive',
      'X-Accel-Buffering': 'no', // tells nginx NOT to buffer this response
    });
    // Flush headers immediately
    res.write(': connected\n\n');

    // Dedicated subscriber connection (Redis subscriber mode is exclusive)
    const subscriber = getRedisClient().duplicate();
    await subscriber.subscribe(APPT_EVENTS_CHANNEL(practiceId ?? ''));

    const onMessage = (_channel: string, message: string) => {
      res.write(`data: ${message}\n\n`);
    };
    subscriber.on('message', onMessage);

    // Heartbeat keeps the connection alive through proxies that close idle streams
    const heartbeat = setInterval(() => {
      res.write(': heartbeat\n\n');
    }, 25_000);

    req.raw.on('close', () => {
      clearInterval(heartbeat);
      subscriber.off('message', onMessage);
      void subscriber.unsubscribe().finally(() => subscriber.disconnect());
    });
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
