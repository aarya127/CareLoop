import { Module } from '@nestjs/common';
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
import { JobsModule } from './jobs/jobs.module';

@Module({
  imports: [
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
    JobsModule,
  ],
})
export class AppModule {}
