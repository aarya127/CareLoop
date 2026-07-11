import { Injectable, Logger } from '@nestjs/common';
import nodemailer from 'nodemailer';
import { integrations } from '../../config/integrations';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  private get transporter() {
    const { host, port, user, pass } = integrations.smtp;
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: user ? { user, pass } : undefined,
    });
  }

  async send(opts: SendEmailOptions): Promise<string> {
    const { from } = integrations.smtp;
    const info = await this.transporter.sendMail({
      from: from ?? 'CareLoop <no-reply@careloop.app>',
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    });
    this.logger.log(`Email sent to ${opts.to}: ${info.messageId}`);
    return info.messageId as string;
  }

  /**
   * Verify a SendGrid inbound webhook signature using HMAC-SHA256.
   * Env var: SENDGRID_WEBHOOK_SECRET
   */
  validateSendgridSignature(rawBody: string, signature: string): boolean {
    const secret = process.env.SENDGRID_WEBHOOK_SECRET;
    if (!secret) {
      // Fail closed in production; allow only in non-production for local testing.
      if (process.env.NODE_ENV === 'production') {
        this.logger.error('SENDGRID_WEBHOOK_SECRET not set — rejecting webhook');
        return false;
      }
      this.logger.warn(
        'SENDGRID_WEBHOOK_SECRET not set — skipping signature validation (non-production only)',
      );
      return true;
    }
    const crypto = require('crypto') as typeof import('crypto');
    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    const expectedBuf = Buffer.from(expected);
    const sigBuf = Buffer.from(signature);
    // timingSafeEqual throws on length mismatch — guard first.
    return sigBuf.length === expectedBuf.length && crypto.timingSafeEqual(sigBuf, expectedBuf);
  }
}
