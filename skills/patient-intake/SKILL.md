# Skill Name: patient-intake

## Description

Capture new-patient intake through a resumable draft, submit it, and create/read patient
records. Wraps the `intake` and `patients` modules.

## Domain

Patient intake & records.

## Dependencies

- **API:** `intake` controller — base `/intake`; `patients` controller — base `/patients`
- **Tables:** `IntakeDraft` (token + `idempotencyKey`, both unique), `IntakeSubmission`, `Patient`
- **Infra:** Postgres

---

## 2. Capability Overview

Lets an agent start a blank intake draft, progressively fill demographics / emergency contact
/ insurance / notes, then submit it — which converts the draft into an `IntakeSubmission` and
(optionally) a `Patient`. It can also read patient records and a record section. Drafts are
idempotent and resumable via their token.

## 3. Step-by-Step Execution Logic

**Create draft (`POST /intake/drafts`):**

1. Receive `{ practiceId }`. POST → returns a draft with a unique `token`.
2. Persist the token; all later updates reference it.

**Update draft (`PATCH /intake/drafts/:id`):** 3. Send any of `{ demographics, emergencyContact, insurance, notes }`. Fields are merged into `IntakeDraft.data` (partial updates are safe).

**Submit (`POST /intake/drafts/:id/submit`):** 4. Pass an `idempotencyKey` (the service stores it `@unique` → safe to retry). 5. The service marks the draft `submitted`, creates an `IntakeSubmission` (`status=pending`), and may create/link a `Patient`. 6. Return the submission id.

**Read patient (`GET /patients/:id`, `GET /patients/:id/record-section/:section`).**

## 4. Inputs & Outputs

### Inputs

- Create: `practiceId` (required).
- Update (all optional): `demographics {firstName,lastName,dateOfBirth,email,phone,address{...}}`, `emergencyContact {name,relationship,phone}`, `insurance {payerName,planName,memberId,groupNumber}`, `notes`.
- Submit: `idempotencyKey` (recommended).

### Outputs

```json
// POST /intake/drafts → 201
{ "id": "draft_…", "token": "tok_…", "status": "draft", "data": {} }
```

```json
// POST /intake/drafts/:id/submit → 201
{ "submissionId": "sub_…", "status": "pending", "patientId": "pat_… | null" }
```

## 5. Tools / APIs Used

- `POST /intake/drafts`, `GET /intake/drafts/:id`, `PATCH /intake/drafts/:id`, `POST /intake/drafts/:id/submit`
- `POST /intake`, `GET /intake/:id`
- `GET /patients`, `GET /patients/:id`, `POST /patients`, `PUT /patients/:id`, `GET/PUT /patients/:id/record-section/:section`

## 6. Edge Cases & Failure Handling

- **Resubmit / network retry** → reuse the same `idempotencyKey`; the unique constraint dedups so no duplicate submission is created.
- **Partial data** → updates merge; submitting an incomplete draft is allowed (status `pending` for staff review) — do not block on optional fields.
- **Duplicate patient** → `Patient` is unique on `(practiceId, phoneE164)`; a clash means the patient likely already exists — read before creating.
- **Insurance member IDs** are encrypted at rest (`memberIdEnc`); never echo raw member IDs back in logs.

## 7. Example Usage

- **Request:** create draft → PATCH demographics+insurance → submit with key `intake-2026-03-10-jane`.
- **Output:** `{ submissionId, status: "pending" }`.
- **Agent reasoning:** "Collect fields incrementally so a dropped call can resume from the token; submit once with a stable idempotency key so retries are safe."

## 8. Optional Resources Folder

Optional `resources/intake-field-map.md`: maps spoken phone-intake answers to draft fields (pairs with the voice-assistant skill).
