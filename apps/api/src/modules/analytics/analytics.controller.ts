import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

interface AnalyticsQuery {
  practiceId?: string;
  rangeDays?: string;
}

@Controller('analytics')
export class AnalyticsController {
  private readonly analyticsService: AnalyticsService;

  constructor(analyticsService?: AnalyticsService) {
    // Some local dev setups run without full decorator metadata.
    this.analyticsService = analyticsService ?? new AnalyticsService();
  }

  @Get('overview')
  getOverview(@Query() query: AnalyticsQuery) {
    return this.analyticsService.getOverview(query);
  }

  @Get('dashboard')
  getDashboard(@Query() query: AnalyticsQuery) {
    return this.analyticsService.getDashboard(query);
  }

  @Get('kpis')
  getKpis(@Query() query: AnalyticsQuery) {
    return this.analyticsService.getKpis(query);
  }

  @Get('revenue')
  getRevenue(@Query() query: AnalyticsQuery) {
    return this.analyticsService.getRevenue(query);
  }

  /** Real invoice + payment data, broken down by status and daily trend. */
  @Get('payments')
  getPayments(@Query() query: AnalyticsQuery) {
    return this.analyticsService.getPayments(query);
  }

  @Get('patients')
  getPatientStats(@Query() query: AnalyticsQuery) {
    return this.analyticsService.getPatientStats(query);
  }

  @Get('appointments')
  getAppointmentStats(@Query() query: AnalyticsQuery) {
    return this.analyticsService.getAppointmentStats(query);
  }

  /** Daily no-show counts and rate trend for charting. */
  @Get('no-show')
  getNoShowTrend(@Query() query: AnalyticsQuery) {
    return this.analyticsService.getNoShowTrend(query);
  }

  @Get('decision-actions')
  getDecisionActions(@Query() query: AnalyticsQuery) {
    return this.analyticsService.getDecisionActions(query);
  }

  @Get('phases')
  getPhases() {
    return this.analyticsService.getPhases();
  }

  @Post('automation/trigger')
  triggerAutomation(@Body() body: Record<string, unknown>) {
    return this.analyticsService.triggerAutomation(body);
  }

  @Post('seed-phase1')
  seedPhase1(@Body() body: Record<string, unknown>) {
    return this.analyticsService.seedPhase1TestData(body);
  }
}

