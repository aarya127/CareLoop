# Skill Name: insurance-verification

## Description
Store, look up, and manage a patient's insurance coverage records. Wraps the `insurance`
module. Member IDs are encrypted at rest and indexed by a SHA-256 hash for safe lookup.

## Domain
Insurance & coverage.

## Dependencies
- **API:** `insurance` controller — base `/insurance` (`apps/api/src/modules/insurance/insurance.controller.ts`)
- **Tables:** `PatientInsurance` (`memberIdEnc`, `memberIdHash`, `coverageSummary` JSON, `active`, `verifiedAt`)
- **Infra:** Postgres; field-level encryption (`ENCRYPTION_KEY`)

---

## 2. Capability Overview
Lets an agent attach an insurance record to a patient, fetch a patient's active coverage, and
look up coverage by member ID (via the hash index, not the plaintext). It reasons about which
plan is `active` and whether coverage has been `verifiedAt`.

## 3. Step-by-Step Execution Logic
**Add coverage (`POST /insurance`):**
1. Receive `{ patientId, payerName, planName?, memberId, groupNumber?, coverageSummary? }`.
2. The service encrypts `memberId` → `memberIdEnc` and stores `memberIdHash = sha256(memberId)` for lookup.
3. POST → returns the record (`active=true`).

**Look up (`GET /insurance/lookup?...`):** query by member ID; the service hashes the input and matches on `memberIdHash` — it never compares plaintext.

**List for patient (`GET /insurance/patient/:patientId`):** returns active coverage records.

## 4. Inputs & Outputs
### Inputs
Required: `patientId`, `payerName`, `memberId`. Optional: `planName`, `groupNumber`, `coverageSummary` (JSON), `active`.
### Outputs
```json
// GET /insurance/patient/:patientId → 200
[ { "id": "ins_…", "payerName": "Delta Dental", "planName": "PPO",
    "active": true, "verifiedAt": null, "coverageSummary": { … } } ]
```

## 5. Tools / APIs Used
- `GET /insurance/patient/:patientId`, `GET /insurance/lookup`, `POST /insurance`, `PUT /insurance/:id`, `DELETE /insurance/:id`

## 6. Edge Cases & Failure Handling
- **⚠ Eligibility verification only — no claims submission.** There is **no `Claim` entity and no OHIP/clearinghouse integration**. This skill manages *coverage records*; it cannot submit, track, or adjudicate claims. Do not promise claim status. (See ARCHITECTURE-INSIGHTS for the proposed `Claim` model.)
- **Never log plaintext member IDs** — they are encrypted at rest; echo only the masked/last-4 form.
- **Lookup misses** → a member ID with no `memberIdHash` match returns empty; that means "not on file", not "ineligible".
- **`verifiedAt = null`** → coverage is on file but unverified; flag to staff before relying on it for billing.
- **Multiple active plans** → coordinate-of-benefits ordering is not modeled; surface all active plans to the operator.

## 7. Example Usage
- **Request:** `POST /insurance {"patientId":"pat_1","payerName":"Delta Dental","memberId":"D12345678","planName":"PPO"}`.
- **Output:** `{ id, active: true, verifiedAt: null }`.
- **Agent reasoning:** "I can record and look up coverage, but I cannot verify eligibility with the payer or file a claim — I'll store the record and mark it unverified for staff."

## 8. Optional Resources Folder
Optional `resources/claim-model.md`: the proposed `Claim` + `ClaimLine` + `ClaimStatusEvent` schema to extend this skill into true claims submission.
