import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('kpis')
  getKpis(@Query() query: any) {
    return this.analyticsService.getKpis(query);
  }

  @Get('revenue')
  getRevenue(@Query() query: any) {
    return this.analyticsService.getRevenue(query);
  }

  @Get('patients')
  getPatientStats(@Query() query: any) {
    return this.analyticsService.getPatientStats(query);
  }

  @Get('appointments')
  getAppointmentStats(@Query() query: any) {
    return this.analyticsService.getAppointmentStats(query);
  }
}
