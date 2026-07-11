# Skill Name: billing-and-payments

## Description

Issue and manage invoices and record payments against them. Wraps the `billing` and
`payments` modules (and links to `treatments`). Covers the invoice lifecycle: draft → sent →
paid/void, plus payment records by method.

## Domain

Billing & payments.

## Dependencies

- **API:** `billing` controller — base `/billing`; `payments` controller — base `/payments`
- **Tables:** `Invoice` (cents, `lineItems` JSON, `status`), `PaymentRecord` (`method`, `amountCents`, `status`), `TreatmentRecord`
- **Infra:** Postgres; `IdempotencyService` for money mutations

---

## 2. Capability Overview

Lets an agent build an invoice from line items, send it, void it, summarize a patient's
balance, and record payments (`card|cash|insurance|check|ach`). It reasons about amounts in
**integer cents**, links invoices to treatments, and tracks payment status
(`pending|completed|refunded|failed`).

## 3. Step-by-Step Execution Logic

**Create invoice (`POST /billing/invoices`):**

1. Receive `CreateInvoiceDto`. Compute `totalAmountCents` = Σ(`qty × unitPriceCents`) and verify it matches the supplied total.
2. POST → returns invoice with `status=draft`.
3. To deliver: `POST /billing/invoices/:id/send` → `status=sent`.

**Record payment (`POST /payments`):** 4. Receive `{ practiceId, invoiceId, patientId, method, amountCents, transactionRef? }`. 5. Send `X-Idempotency-Key` (a payment must not be double-recorded on retry). 6. POST → creates a `PaymentRecord`; reconcile against the invoice. When fully paid, set the invoice `paid` via `PATCH /billing/invoices/:id`.

**Summaries:** `GET /billing/summary?practiceId&patientId` for balance; `GET /payments` to list.

## 4. Inputs & Outputs

### Inputs

- Invoice (required): `practiceId`, `patientId`, `totalAmountCents`. Optional: `treatmentId`, `payerType` (`patient|insurance`), `lineItems[]`, `notes`, `dueDate`.
- Payment (required): `practiceId`, `invoiceId`, `patientId`, `method`, `amountCents`. Optional: `payerType`, `transactionRef`, `paidAt`.

### Outputs

```json
// POST /billing/invoices → 201
{ "id": "inv_…", "status": "draft", "totalAmountCents": 18000, "lineItems": [ … ] }
```

```json
// POST /payments → 201
{ "id": "pay_…", "invoiceId": "inv_…", "amountCents": 18000, "status": "completed" }
```

## 5. Tools / APIs Used

- `GET /billing/summary`, `GET /billing/invoices`, `GET /billing/invoices/:id`, `POST /billing/invoices`, `PATCH /billing/invoices/:id`, `POST /billing/invoices/:id/send`, `POST /billing/invoices/:id/void`
- `GET /payments`, `GET /payments/:id`, `POST /payments`, `PATCH /payments/:id`

## 6. Edge Cases & Failure Handling

- **⚠ No payment processor wired.** There is **no Stripe integration** (no `stripe` dependency). `POST /payments` records a _ledger entry_ only — it does **not** charge a card. An agent must NOT claim a card was charged. `transactionRef` is a free-form external reference. Surface this limitation to the operator.
- **Retry safety** → always send `X-Idempotency-Key`; without it a retry duplicates the `PaymentRecord`.
- **Amount integrity** → all amounts are integer cents; reject/flag any non-integer or mismatched line-item total.
- **Overpayment / partial** → sum payments vs `totalAmountCents`; only mark the invoice `paid` when fully covered.
- **Void vs delete** → use `/void`; never hard-delete financial records (audit trail).

## 7. Example Usage

- **Request:** create invoice $180 (one line item) → send → record `cash` payment $180 → mark paid.
- **Output:** invoice `paid`, payment `completed`.
- **Agent reasoning:** "Cash payment is a real ledger event; a card payment is NOT possible here yet, so for card I record `pending` and flag that processor integration is missing."

## 8. Optional Resources Folder

Optional `resources/stripe-integration.md`: the not-yet-built plan (PaymentIntents + webhook → `WebhookLog`) so this skill upgrades cleanly when Stripe lands.
