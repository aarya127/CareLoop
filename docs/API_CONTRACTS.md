# API Contract Documentation

This document outlines the API endpoints, request/response schemas, and integration points for the CareLoop application.

## Base Configuration

- **Base URL**: `process.env.NEXT_PUBLIC_API_BASE_URL`
- **WebSocket URL**: `process.env.NEXT_PUBLIC_WS_BASE_URL`
- **Authentication**: Bearer JWT token in `Authorization` header
- **Tenant ID**: Required in `X-Tenant-ID` header for all requests

## Authentication

All API requests must include:
\`\`\`http
Authorization: Bearer <jwt_token>
X-Tenant-ID: <tenant_id>
\`\`\`

## Endpoints

### Insights & KPIs

#### GET `/insights/today`
Returns today's practice KPI metrics.

**Response:**
\`\`\`json
{
  "todayAppointments": {
    "count": 24,
    "sparkline": [18, 22, 19, 24, 21, 24]
  },
  "utilization": {
    "percentage": 87,
    "trend": 5
  },
  "cancellations": {
    "count": 3,
    "trend": [5, 4, 6, 3, 4, 3]
  },
  "insuranceVerifications": {
    "pending": 7
  }
}
\`\`\`

### Patients

#### GET `/patients/recent`
Returns recently accessed patients.

**Response:**
\`\`\`json
[
  {
    "id": "patient_123",
    "firstName": "Sarah",
    "lastName": "Johnson",
    "dateOfBirth": "1985-03-15",
    "phone": "(555) 123-4567",
    "email": "sarah@email.com",
    "tags": ["Allergies: Penicillin"],
    "avatar": null
  }
]
\`\`\`

#### GET `/patients/:id`
Returns detailed patient information.

#### GET `/patients/:id/summary`
Returns patient summary for quick view (demographics + key info).

#### GET `/patients/search?q=<query>`
Search patients by name, phone, email, or patient ID.

**Query Parameters:**
- `q` (string, required): Search query
- `limit` (number, optional): Max results (default: 20)

### Insurance

#### GET `/insurance/:patientId/eligibility`
Returns insurance eligibility status.

**Response:**
\`\`\`json
{
  "patientId": "patient_123",
  "payer": "Delta Dental",
  "plan": "PPO Plus",
  "memberId": "DD123456789",
  "eligibilityStatus": "active",
  "deductible": 1500,
  "deductibleMet": 750,
  "remainingBenefits": 2000,
  "lastVerified": "2025-10-15T00:00:00Z"
}
\`\`\`

#### POST `/insurance/:patientId/verify`
Trigger insurance verification.

**Request:**
\`\`\`json
{
  "procedureCodes": ["D0150", "D1110"]
}
\`\`\`

### Calendar & Appointments

#### GET `/calendar`
Returns appointments for calendar view.

**Query Parameters:**
- `view` (string): "day" | "week" | "month"
- `providerIds` (string[]): Filter by provider IDs
- `roomIds` (string[]): Filter by room IDs
- `from` (ISO date): Start date
- `to` (ISO date): End date

**Response:**
\`\`\`json
[
  {
    "id": "appt_123",
    "patientId": "patient_123",
    "providerId": "provider_456",
    "roomId": "room_1",
    "title": "Sarah Johnson - New Patient",
    "type": "new_patient",
    "start": "2025-10-17T09:00:00Z",
    "end": "2025-10-17T10:00:00Z",
    "status": "confirmed",
    "insurancePending": false,
    "balanceDue": false
  }
]
\`\`\`

#### POST `/appointments`
Create new appointment.

**Request:**
\`\`\`json
{
  "patientId": "patient_123",
  "providerId": "provider_456",
  "roomId": "room_1",
  "title": "Cleaning",
  "type": "hygiene",
  "start": "2025-10-20T14:00:00Z",
  "end": "2025-10-20T15:00:00Z",
  "notes": "Patient prefers afternoon appointments"
}
\`\`\`

#### PUT `/appointments/:id`
Update appointment (reschedule, change status, etc.).

**Request:**
\`\`\`json
{
  "start": "2025-10-21T10:00:00Z",
  "end": "2025-10-21T11:00:00Z",
  "status": "rescheduled"
}
\`\`\`

#### GET `/appointments/availability`
Check provider/room availability.

**Query Parameters:**
- `providerId` (string, required)
- `date` (ISO date, required)
- `duration` (number): Duration in minutes (default: 60)

### Calls

#### GET `/calls/recent`
Returns recent call summaries.

**Response:**
\`\`\`json
[
  {
    "id": "call_123",
    "patientId": "patient_123",
    "direction": "inbound",
    "status": "completed",
    "startTime": "2025-10-17T10:00:00Z",
    "endTime": "2025-10-17T10:05:00Z",
    "duration": 300,
    "summary": "Patient requesting appointment for tooth pain",
    "intents": ["appointment_book", "emergency"],
    "recordingUrl": "https://..."
  }
]
\`\`\`

#### GET `/calls/:id`
Returns detailed call information including full transcript.

#### GET `/calls/:id/recording`
Returns call recording URL.

### Queue & Actions

#### GET `/queue/actions`
Returns action items requiring staff attention.

**Response:**
\`\`\`json
[
  {
    "id": "action_123",
    "type": "insurance_needed",
    "patientId": "patient_123",
    "patientName": "Sarah Johnson",
    "description": "Insurance information needed",
    "priority": "high",
    "createdAt": "2025-10-17T09:00:00Z"
  }
]
\`\`\`

#### POST `/queue/actions/:id/resolve`
Mark action item as resolved.

### Billing

#### GET `/billing/:patientId/balance`
Returns patient balance details.

**Response:**
\`\`\`json
{
  "patientId": "patient_123",
  "balance": 120.00,
  "currency": "USD",
  "lastPayment": {
    "date": "2025-09-01T00:00:00Z",
    "amount": 80.00,
    "method": "credit_card"
  },
  "aging": {
    "current": 50.00,
    "days30": 70.00,
    "days60": 0,
    "days90": 0
  }
}
\`\`\`

## WebSocket Events

Connect to WebSocket endpoint for real-time updates:

\`\`\`javascript
const ws = new WebSocket(WS_BASE_URL + '/events');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch(data.type) {
    case 'CALL_STARTED':
      // Handle incoming call
      break;
    case 'CALL_ENDED':
      // Update call status
      break;
    case 'APPOINTMENT_CREATED':
      // Refresh calendar
      break;
    // ... other events
  }
};
\`\`\`

### Event Types

#### CALL_STARTED
\`\`\`json
{
  "type": "CALL_STARTED",
  "data": {
    "callId": "call_123",
    "direction": "inbound",
    "phoneNumber": "+15551234567",
    "timestamp": "2025-10-17T10:00:00Z"
  }
}
\`\`\`

#### INTENT_APPOINTMENT_BOOK
\`\`\`json
{
  "type": "INTENT_APPOINTMENT_BOOK",
  "data": {
    "callId": "call_123",
    "patientId": "patient_123",
    "requestedDate": "2025-10-20",
    "reason": "tooth pain"
  }
}
\`\`\`

#### INSURANCE_VERIFY_REQUEST
\`\`\`json
{
  "type": "INSURANCE_VERIFY_REQUEST",
  "data": {
    "patientId": "patient_123",
    "requestedBy": "ai_agent",
    "procedureCodes": ["D0150"]
  }
}
\`\`\`

#### CALL_SUMMARY_READY
\`\`\`json
{
  "type": "CALL_SUMMARY_READY",
  "data": {
    "callId": "call_123",
    "summary": "Patient requesting appointment...",
    "intents": ["appointment_book"],
    "sentiment": "neutral"
  }
}
\`\`\`

## Error Handling

All API endpoints return standard error responses:

\`\`\`json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Patient ID is required",
    "details": {
      "field": "patientId",
      "constraint": "required"
    }
  }
}
\`\`\`

### Error Codes
- `UNAUTHORIZED`: Invalid or missing authentication token
- `FORBIDDEN`: Insufficient permissions for operation
- `NOT_FOUND`: Resource not found
- `INVALID_REQUEST`: Validation error
- `CONFLICT`: Resource conflict (e.g., double booking)
- `INTERNAL_ERROR`: Server error

## Rate Limiting

- Standard endpoints: 100 requests/minute per tenant
- Search endpoints: 30 requests/minute per tenant
- WebSocket: 1 connection per user session

## Webhooks (Optional)

Configure webhooks to receive notifications:

### POST `/webhooks/configure`
\`\`\`json
{
  "url": "https://your-domain.com/webhook",
  "events": ["appointment_created", "call_completed"],
  "secret": "webhook_secret_key"
}
\`\`\`

Webhook payloads include HMAC signature for verification.
