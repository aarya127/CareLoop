import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { RequireRole } from '../../common/guards';
import { MANAGEMENT_ROLES, AUTH_ROLES } from '../auth/auth.constants';

interface AnalyticsQuery {
  practiceId?: string;
  rangeDays?: string;
}

// Business metrics — management only.
@Controller('analytics')
@RequireRole(...MANAGEMENT_ROLES)
export class AnalyticsController {
  private readonly analyticsService: AnalyticsService;

  constructor(analyticsService?: AnalyticsService) {
    // Some local dev setups run without full decorator metadata.
    this.analyticsService = analyticsService ?? new AnalyticsService();
  }

  // practiceId is always taken from the authenticated session, never client input,
  // so one practice's staff can never read another practice's analytics.
  private scoped(query: AnalyticsQuery, req: any): AnalyticsQuery {
    return { ...query, practiceId: req.user.practiceId };
  }

  @Get('overview')
  getOverview(@Query() query: AnalyticsQuery, @Req() req: any) {
    return this.analyticsService.getOverview(this.scoped(query, req));
  }

  @Get('dashboard')
  getDashboard(@Query() query: AnalyticsQuery, @Req() req: any) {
    return this.analyticsService.getDashboard(this.scoped(query, req));
  }

  @Get('kpis')
  getKpis(@Query() query: AnalyticsQuery, @Req() req: any) {
    return this.analyticsService.getKpis(this.scoped(query, req));
  }

  @Get('revenue')
  getRevenue(@Query() query: AnalyticsQuery, @Req() req: any) {
    return this.analyticsService.getRevenue(this.scoped(query, req));
  }

  /** Real invoice + payment data, broken down by status and daily trend. */
  @Get('payments')
  getPayments(@Query() query: AnalyticsQuery, @Req() req: any) {
    return this.analyticsService.getPayments(this.scoped(query, req));
  }

  @Get('patients')
  getPatientStats(@Query() query: AnalyticsQuery, @Req() req: any) {
    return this.analyticsService.getPatientStats(this.scoped(query, req));
  }

  @Get('appointments')
  getAppointmentStats(@Query() query: AnalyticsQuery, @Req() req: any) {
    return this.analyticsService.getAppointmentStats(this.scoped(query, req));
  }

  /** Daily no-show counts and rate trend for charting. */
  @Get('no-show')
  getNoShowTrend(@Query() query: AnalyticsQuery, @Req() req: any) {
    return this.analyticsService.getNoShowTrend(this.scoped(query, req));
  }

  @Get('decision-actions')
  getDecisionActions(@Query() query: AnalyticsQuery, @Req() req: any) {
    return this.analyticsService.getDecisionActions(this.scoped(query, req));
  }

  @Get('phases')
  getPhases() {
    return this.analyticsService.getPhases();
  }

  @Post('automation/trigger')
  triggerAutomation(@Body() body: Record<string, unknown>, @Req() req: any) {
    return this.analyticsService.triggerAutomation({ ...body, practiceId: req.user.practiceId });
  }

  @Post('seed-phase1')
  @RequireRole(AUTH_ROLES.ADMIN) // destructive test-data seeder — admin only
  seedPhase1(@Body() body: Record<string, unknown>, @Req() req: any) {
    return this.analyticsService.seedPhase1TestData({ ...body, practiceId: req.user.practiceId });
  }
}
