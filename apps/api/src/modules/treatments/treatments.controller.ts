import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TreatmentsService } from './treatments.service';
import type { CreateTreatmentDto, UpdateTreatmentDto } from './dto';

@Controller('treatments')
export class TreatmentsController {
  constructor(private readonly treatmentsService: TreatmentsService) {}

  /** GET /treatments?practiceId=&patientId=&providerId=&appointmentId=&status=&from=&to= */
  @Get()
  findAll(@Query() query: {
    practiceId?: string;
    patientId?: string;
    providerId?: string;
    appointmentId?: string;
    status?: string;
    from?: string;
    to?: string;
  }) {
    return this.treatmentsService.findAll(query);
  }

  /** GET /treatments/:id */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.treatmentsService.findById(id);
  }

  /** POST /treatments */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() dto: CreateTreatmentDto,
    @Headers('x-actor-user-id') actorUserId?: string,
  ) {
    return this.treatmentsService.create(dto, actorUserId);
  }

  /** PUT /treatments/:id */
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTreatmentDto,
    @Headers('x-actor-user-id') actorUserId?: string,
  ) {
    return this.treatmentsService.update(id, dto, actorUserId);
  }

  /** DELETE /treatments/:id */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id') id: string,
    @Headers('x-actor-user-id') actorUserId?: string,
  ) {
    return this.treatmentsService.remove(id, actorUserId);
  }
}

