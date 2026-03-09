# Pipecat Integration Guide (CareLoop)

## Goal
Use Pipecat as the voice AI runtime and verify locally before telephony production rollout.

## What was added
- Local Pipecat bot scaffold: `pipecat-agent/`
- Status API: `GET /api/voice/pipecat/status`
- AI Assistant UI test panel with status check + client launcher
- Orchestrator support for `pipecat` in CareLoop backend

## Environment variables (CareLoop)
Add these to your CareLoop `.env`:

```env
PIPECAT_BASE_URL=http://localhost:7860
PIPECAT_HEALTH_URL=http://localhost:7860
PIPECAT_CLIENT_URL=http://localhost:7860/client
```

## Local test steps

1. Start CareLoop app:

```bash
npm run dev:turbo
```

2. Start Pipecat bot:

```bash
cd pipecat-agent
cp .env.example .env
# Add real API keys in .env
python bot.py
```

3. Open CareLoop AI Assistant page:
- Navigate to `Admin -> AI Assistant`
- In "Pipecat Local Test" panel:
  - Click `Check Pipecat`
  - Click `Open Pipecat Client`

4. Voice test:
- Browser opens `http://localhost:7860/client`
- Allow microphone
- Talk to bot and confirm response audio

## Next production step (recommended)
- Add telephony transport flow (Twilio/Telnyx serializer)
- Route call metadata and transcript segments back to CareLoop tool APIs
- Add webhook signatures + auth + idempotency guards
