# Skill Name: scheduling

## Description
Find open appointment slots for a provider and create, reschedule, or cancel appointments.
Wraps the `appointments` module and its `AvailabilityService` (Redis-cached slot computation
that respects schedules, existing appointments, blocks, and holds).

## Domain
Scheduling & availability.

## Dependencies
- **API:** `appointments` controller — base `/appointments` (`apps/api/src/modules/appointments/appointments.controller.ts`)
- **Services:** `AvailabilityService` (`getSlots`, 60 s Redis cache), `AppointmentsRepository`
- **Tables:** `Appointment`, `AppointmentHold`, `ProviderSchedule`, `AvailabilityBlock`, `Provider`, `Room`
- **Infra:** Redis (slot cache), Postgres

---

## 2. Capability Overview
Lets an agent answer "when can patient X see provider Y?" and then commit a booking. It reads
provider schedules and busy intervals (appointments + blocks + holds) to emit free slots, then
writes an `Appointment`. It can decide whether a requested time is free, pick the next open
slot, and move/cancel existing appointments. Slot results are cached per
`provider:date:duration` for 60 s.

## 3. Step-by-Step Execution Logic
**Find slots (`GET /appointments/availability`):**
1. Receive `{ practiceId, providerId, date (YYYY-MM-DD), duration (min) }`.
2. Validate all four present; `duration` coerces to a number.
3. Call the endpoint. `AvailabilityService` checks Redis (`avail:<provider>:<date>:<duration>`); on miss it computes slots from `ProviderSchedule` minus busy intervals.
4. Receive `TimeSlot[]`; filter `available === true`.
5. If none available → report no availability (do not invent a slot).

**Book (`POST /appointments`):**
1. Receive `CreateAppointmentDto` (see Inputs).
2. Confirm the chosen `start`/`end` is in the available set from the step above.
3. POST. The repository persists the `Appointment` (unique on `practiceId+calendarId+googleEventId` when synced).
4. On success, return the appointment id/status (`confirmed`).
5. Invalidate the availability cache for that provider/date (the service does this on write paths).

**Reschedule (`PATCH /appointments/:id/reschedule`)** / **Cancel (`PATCH /appointments/:id/cancel`)**: send new `{ start, end }` or `{ reason }`.

## 4. Inputs & Outputs
### Inputs (create)
Required: `practiceId`, `userId` (booking staff), `providerId`, `start` (ISO), `end` (ISO).
Optional: `patientId`, `roomId`, `title`, `timeZone`, `notes`, `procedureCode`, `source` (`manual|ai|online`).
### Outputs
```json
// GET /appointments/availability
[ { "start": "2026-03-10T09:00:00.000Z", "end": "2026-03-10T09:30:00.000Z", "available": true } ]
```
```json
// POST /appointments → 201
{ "id": "appt_…", "status": "confirmed", "start": "…", "end": "…", "providerId": "prov_…" }
```

## 5. Tools / APIs Used
- `GET /appointments/availability`, `GET /appointments`, `GET /appointments/:id`, `GET /appointments/events`
- `POST /appointments`, `PATCH /appointments/:id/reschedule`, `PATCH /appointments/:id/cancel`, `DELETE /appointments/:id`
- Internal: `AvailabilityService.getSlots` / `invalidateCache`

## 6. Edge Cases & Failure Handling
- **No schedule that day** → empty slot list (provider not working). Report, don't guess.
- **Double-booking race** → a slot can be taken between read and write; on conflict, re-fetch availability and pick again (max 2 retries), then surface failure.
- **Holds** (`AppointmentHold.expiresAt`) count as busy until they expire — a slot may free up later.
- **Stale cache** → at most 60 s old; for high-stakes booking, treat availability as advisory and rely on the write to be authoritative.
- **Timezone:** `date` is interpreted against the provider's local day; always pass explicit ISO `start`/`end` for booking.

## 7. Example Usage
- **Request:** `GET /appointments/availability?practiceId=p1&providerId=prov1&date=2026-03-10&duration=30`
- **Output:** array of slots; agent picks the first `available`.
- **Agent reasoning:** "Patient wants a 30-min cleaning Tuesday AM → fetch slots → choose 09:00 → POST appointment with that exact ISO range → on 409 re-fetch and retry."

## 8. Optional Resources Folder
Optional `resources/next-available.md`: heuristic for scanning N days forward when the requested date is full.
