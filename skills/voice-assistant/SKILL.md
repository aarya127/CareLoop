# Skill Name: voice-assistant

## Description
Drive the AI phone assistant: answer/inbound Twilio calls, synthesize speech with ElevenLabs,
expose scheduling/patient tools to the call agent, and capture transcripts. Wraps the Next.js
voice API routes and the worker transcript processors.

## Domain
AI voice / telephony orchestration.

## Dependencies
- **API (Next.js, port 3000):** `app/api/voice/**` — telephony webhook/gather, ElevenLabs TTS/assistant, call tools, transcript segment/finalize, human "overtake" control
- **External:** Twilio (telephony), ElevenLabs (`ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`)
- **Worker:** `finalize-transcript` processor
- **Tables:** `CallTranscript` (`callSid` unique, `handoffOccurred`, `sentimentScore`), `CallTranscriptSegment`

---

## 2. Capability Overview
Lets an agent operate a phone call end-to-end: receive a Twilio webhook, gather caller speech,
fetch patient context, check availability, create an appointment from the call, stream
ElevenLabs audio back, persist transcript segments, and finalize the transcript when the call
ends. It can also hand the call off to a human ("overtake"). It composes the **scheduling**
and **patient-intake** skills via dedicated voice tool routes.

## 3. Step-by-Step Execution Logic
1. **Inbound** → Twilio hits `POST /api/voice/telephony/webhook`; respond with TwiML to gather speech.
2. **Gather** → `POST /api/voice/telephony/gather` delivers recognized speech; the assistant decides intent.
3. **Context** → `POST /api/voice/tools/patient-context` to look up the caller's patient record.
4. **Availability** → `POST /api/voice/tools/calendar-availability` (delegates to the scheduling domain).
5. **Book** → `POST /api/voice/tools/create-appointment` to commit a slot (`source='ai_voice'`).
6. **Speak** → `POST /api/voice/elevenlabs/tts` to synthesize the response; stream audio back via the telephony audio route.
7. **Transcript** → `POST /api/voice/tools/transcripts/segment` per utterance; `POST /api/voice/tools/transcripts/finalize` at hang-up (worker `finalize-transcript` post-processes).
8. **Handoff** → if confidence is low or caller requests a human, `POST /api/voice/overtake/control`; set `handoffOccurred=true`.

## 4. Inputs & Outputs
### Inputs
- Telephony webhook: Twilio form payload (`CallSid`, `From`, `SpeechResult`, …).
- Tool calls: `{ practiceId, callSid, … }` plus tool-specific fields (e.g. availability `{ providerId, date, duration }`).
- TTS: `{ text, voiceId? }`.
### Outputs
```json
// POST /api/voice/tools/calendar-availability → 200
{ "slots": [ { "start": "…", "end": "…", "available": true } ] }
```
```json
// POST /api/voice/tools/create-appointment → 201
{ "appointmentId": "appt_…", "status": "confirmed", "source": "ai_voice" }
```

## 5. Tools / APIs Used
- `POST /api/voice/telephony/webhook`, `/api/voice/telephony/gather`, `GET /api/voice/telephony/audio/:id`
- `POST /api/voice/tools/patient-context`, `/calendar-availability`, `/create-appointment`
- `POST /api/voice/tools/transcripts/segment`, `/transcripts/finalize`
- `POST /api/voice/elevenlabs/tts`, `/elevenlabs/assistant`; `POST /api/voice/overtake/control`, `GET /api/voice/overtake/state/:callId`
- External: Twilio REST/TwiML, ElevenLabs TTS

## 6. Edge Cases & Failure Handling
- **ElevenLabs/Twilio outage or missing keys** → if `ELEVENLABS_API_KEY`/`TWILIO_*` are unset, voice is unavailable; fall back to a TwiML "please call back" or transfer to a human. Do not silently drop the call.
- **Low ASR confidence** → reprompt once; on second failure, hand off (`overtake`) rather than guess medical/scheduling details.
- **Duplicate webhook** → `CallTranscript.callSid` is unique; dedupe on it.
- **⚠ No LLM provider wired** → there is **no OpenAI/Anthropic SDK** in the repo. Transcript summarization / smart suggestions are not implemented (`transcriptEmbedding` exists but nothing populates it). Treat "AI understanding" as ElevenLabs voice + rule-based tools only, unless an LLM is added.
- **PHI on calls** → never read full member IDs or sensitive notes aloud; confirm identity before disclosing record details.

## 7. Example Usage
- **Request:** inbound call → "I'd like to book a cleaning next Tuesday" → patient-context → availability → create-appointment → TTS confirmation → finalize transcript.
- **Output:** `appointmentId` booked with `source='ai_voice'`, transcript stored.
- **Agent reasoning:** "I orchestrate existing scheduling tools over the phone channel; if I can't confidently parse intent I hand off to a human rather than mis-book."

## 8. Optional Resources Folder
Optional `resources/intents.md`: intent → tool routing table; `resources/llm-upgrade.md`: where to insert a Claude call for summarization/intent once an LLM is added.
