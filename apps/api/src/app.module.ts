import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { RedisThrottlerStorage } from './common/services/redis-throttler.storage';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { IntakeModule } from './modules/intake/intake.module';
import { PatientsModule } from './modules/patients/patients.module';
import { InsuranceModule } from './modules/insurance/insurance.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { TreatmentsModule } from './modules/treatments/treatments.module';
import { BillingModule } from './modules/billing/billing.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { MessagingModule } from './modules/messaging/messaging.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AuditModule } from './modules/audit/audit.module';
import { SearchModule } from './modules/search/search.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { AdminModule } from './modules/admin/admin.module';
import { RemindersModule } from './modules/reminders/reminders.module';
import { JobsModule } from './jobs/jobs.module';
import { SessionAuthGuard } from './common/guards/session-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { IdempotencyService } from './common/services/idempotency.service';

@Module({
  imports: [
    // Global rate limiting: 100 req/min per IP by default; login overrides to 10/min.
    // RedisThrottlerStorage ensures counters are shared across all API replicas
    // so rate limits are enforced per-IP globally, not per-instance.
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60000, limit: 100 }],
      storage: new RedisThrottlerStorage(),
    }),
    HealthModule,
    AuthModule,
    UsersModule,
    IntakeModule,
    PatientsModule,
    InsuranceModule,
    AppointmentsModule,
    TreatmentsModule,
    BillingModule,
    PaymentsModule,
    DocumentsModule,
    MessagingModule,
    AnalyticsModule,
    AuditModule,
    SearchModule,
    WebhooksModule,
    AdminModule,
    RemindersModule,
    JobsModule,
  ],
  providers: [
    // Apply session auth globally; use @Public() on routes that don't need it
    { provide: APP_GUARD, useClass: SessionAuthGuard },
    // Apply role guard globally; use @Roles() to restrict
    { provide: APP_GUARD, useClass: RolesGuard },
    // Apply throttler globally
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // Idempotency service available to all modules
    IdempotencyService,
  ],
})
export class AppModule {}
