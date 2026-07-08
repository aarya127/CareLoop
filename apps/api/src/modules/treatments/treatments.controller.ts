import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TreatmentsService } from './treatments.service';
import { CreateTreatmentDto, UpdateTreatmentDto } from './dto';

@Controller('treatments')
export class TreatmentsController {
  constructor(private readonly treatmentsService: TreatmentsService) {}

  /** GET /treatments?patientId=&providerId=&appointmentId=&status=&from=&to= (practice from session) */
  @Get()
  findAll(
    @Query() query: {
      patientId?: string;
      providerId?: string;
      appointmentId?: string;
      status?: string;
      from?: string;
      to?: string;
    },
    @Req() req: any,
  ) {
    return this.treatmentsService.findAll(req.user.practiceId, query);
  }

  /** GET /treatments/:id */
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.treatmentsService.findById(req.user.practiceId, id);
  }

  /** POST /treatments */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateTreatmentDto, @Req() req: any) {
    return this.treatmentsService.create(req.user.practiceId, dto, req.user.id);
  }

  /** PUT /treatments/:id */
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTreatmentDto, @Req() req: any) {
    return this.treatmentsService.update(req.user.practiceId, id, dto, req.user.id);
  }

  /** DELETE /treatments/:id */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @Req() req: any) {
    return this.treatmentsService.remove(req.user.practiceId, id, req.user.id);
  }
}
