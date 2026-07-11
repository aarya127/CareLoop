import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ClaimsService } from './claims.service';
import { CreateClaimDto, UpdateClaimStatusDto } from './dto';
import { RequireRole } from '../../common/guards';
import { FRONT_OFFICE_ROLES } from '../auth/auth.constants';

// Claims are a billing/money function — front office only (clinical roles excluded).
@Controller('claims')
@RequireRole(...FRONT_OFFICE_ROLES)
export class ClaimsController {
  constructor(private readonly claims: ClaimsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateClaimDto, @Req() req: any) {
    return this.claims.create(req.user.practiceId, req.user.id, dto);
  }

  @Get()
  list(@Req() req: any, @Query('patientId') patientId?: string, @Query('status') status?: string) {
    return this.claims.list(req.user.practiceId, { patientId, status });
  }

  @Get(':id')
  get(@Param('id') id: string, @Req() req: any) {
    return this.claims.get(req.user.practiceId, id);
  }

  @Post(':id/submit')
  @HttpCode(HttpStatus.OK)
  submit(@Param('id') id: string, @Req() req: any) {
    return this.claims.submit(req.user.practiceId, id, req.user.id);
  }

  @Post(':id/status')
  @HttpCode(HttpStatus.OK)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateClaimStatusDto, @Req() req: any) {
    return this.claims.updateStatus(req.user.practiceId, id, req.user.id, dto);
  }
}
