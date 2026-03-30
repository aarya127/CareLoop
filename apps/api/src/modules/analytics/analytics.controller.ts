import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  private readonly analyticsService: AnalyticsService;

  constructor(analyticsService?: AnalyticsService) {
    // Some local dev setups run without full decorator metadata.
    this.analyticsService = analyticsService ?? new AnalyticsService();
  }

  @Get('overview')
  getOverview(@Query() query: any) {
    return this.analyticsService.getOverview(query);
  }

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

  @Get('decision-actions')
  getDecisionActions(@Query() query: any) {
    return this.analyticsService.getDecisionActions(query);
  }

  @Get('phases')
  getPhases() {
    return this.analyticsService.getPhases();
  }

  @Post('automation/trigger')
  triggerAutomation(@Body() body: any) {
    return this.analyticsService.triggerAutomation(body);
  }

  @Post('seed-phase1')
  seedPhase1(@Body() body: any) {
    return this.analyticsService.seedPhase1TestData(body);
  }
}
