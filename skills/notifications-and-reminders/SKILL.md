# Skill Name: notifications-and-reminders

## Description
Send transactional SMS/email immediately, or schedule reminders (appointment reminders,
recalls, payment-due) for future delivery by the worker. Wraps the `messaging` and `reminders`
modules plus the BullMQ delivery pipeline.

## Domain
Notifications & messaging (outbound).

## Dependencies
- **API:** `messaging` controller — base `/messaging`; `reminders` controller — base `/reminders`
- **Services:** `TwilioService` (SMS), `EmailService` (SMTP via nodemailer), `RemindersService`
- **Worker:** `reminders.processor`, `reminder-scan.processor` (BullMQ/Redis)
- **Tables:** `Reminder` (`channel`, `type`, `status`, `scheduledAt`, `retryCount`), `WebhookLog`, `FailedJob`

---

## 2. Capability Overview
Lets an agent (a) send a one-off SMS or email now (`POST /messaging/send`), or (b) schedule a
reminder for later (`POST /messaging/reminders/schedule` or `POST /reminders`) which the worker
picks up at `scheduledAt`. It can list reminder history per patient/appointment, send a pending
reminder immediately, or cancel one. Decisions: pick channel, dedupe, and respect delivery status.

## 3. Step-by-Step Execution Logic
**Send now (`POST /messaging/send`):**
1. Receive `{ practiceId, patientId, channel ('sms'|'email'), to, subject?, body }`.
2. Validate: `email` channel requires `subject`; `to` must be E.164 (SMS) or a valid email.
3. POST → service dispatches via Twilio (SMS) or SMTP (email). If `reminderId` is supplied, the matching `Reminder` is marked `sent`.

**Schedule (`POST /reminders` or `/messaging/reminders/schedule`):**
4. Receive the same fields plus `type` and `scheduledAt` (ISO).
5. POST → creates a `Reminder` (`status=pending`). The worker's scan picks it up at the due time and delivers it.
6. To force early delivery: `POST /reminders/:id/send`. To stop it: `PATCH /reminders/:id/cancel`.

## 4. Inputs & Outputs
### Inputs
- Send: `practiceId`, `patientId`, `channel`, `to`, `body` (required); `subject` (email), `reminderId` (optional).
- Schedule: above + `type` (`appointment_reminder|recall|payment_due`), `scheduledAt` (required), `appointmentId`, `metadata` (optional).
### Outputs
```json
// POST /messaging/send → 200
{ "channel": "sms", "to": "+15555550123", "status": "sent", "providerRef": "SM…" }
```
```json
// POST /reminders → 201
{ "id": "rem_…", "status": "pending", "scheduledAt": "2026-03-09T14:00:00Z", "channel": "sms" }
```

## 5. Tools / APIs Used
- `POST /messaging/send`, `POST /messaging/reminders/schedule`, `GET /messaging/conversations/:patientId`
- `POST /reminders`, `GET /reminders/pending`, `GET /reminders/patient/:patientId`, `GET /reminders/appointment/:appointmentId`, `POST /reminders/:id/send`, `PATCH /reminders/:id/cancel`, `PATCH /reminders/:id/sent`, `GET /reminders/history`
- Internal: `TwilioService`, `EmailService`; worker BullMQ queues

## 6. Edge Cases & Failure Handling
- **Email is raw SMTP** (nodemailer) — there is **no managed provider (SES/SendGrid)**, so deliverability/bounce tracking is limited. Flag this for anything compliance-sensitive.
- **Push channel is modeled but not implemented** — `Reminder.channel` allows `"push"` but there is no FCM/web-push transport. Do not schedule `push` reminders expecting delivery.
- **Delivery failure** → worker increments `Reminder.retryCount` and sets `failReason`; after retries exhaust, a `FailedJob` (DLQ) row is written. Check DLQ before re-sending to avoid duplicates.
- **Inbound webhooks** (Twilio/email status) are deduped via `WebhookLog.idempotencyKey`.
- **Channel/`to` mismatch** → sending an email body to an SMS `to` fails validation; match channel to destination.

## 7. Example Usage
- **Request:** schedule an `appointment_reminder` SMS for 24 h before an appointment.
- **Output:** `{ id: "rem_5", status: "pending" }`; worker sends it at `scheduledAt`.
- **Agent reasoning:** "For future sends I create a `Reminder` and let the worker deliver (durable, retried); for an immediate confirmation I call `/messaging/send` directly."

## 8. Optional Resources Folder
Optional `resources/templates/`: message templates for `appointment_reminder`, `recall`, `payment_due` (currently inline — externalizing them is a recommended improvement).
