# Pipecat Agent for CareLoop

This folder contains a local Pipecat voice bot setup for CareLoop testing.

## Prerequisites
- Python 3.11+ recommended (3.10 works with compatibility shim in `bot.py`)
- `uv` package manager (recommended) or `pip`
- API keys:
  - Deepgram (STT)
  - OpenAI (LLM)
  - Cartesia (TTS)

## Setup

1. Copy env file:

```bash
cp .env.example .env
```

2. Add your API keys to `.env`.

3. Install dependencies:

Using `uv`:

```bash
uv venv
uv pip install -r requirements.txt
```

Using `pip`:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Use an isolated virtual environment for this agent. Installing into system Python can conflict with other ML/data packages.

## Run locally

```bash
python bot.py
```

If startup is successful, Pipecat exposes a local WebRTC test client URL (typically `http://localhost:7860/client`).

Open that URL in your browser, allow microphone access, and start talking to verify voice round-trip.

## How this connects to CareLoop
- CareLoop UI has a Pipecat test panel in Admin -> AI Assistant.
- It checks local Pipecat reachability and links to the WebRTC client URL.
- Configure `PIPECAT_CLIENT_URL` in CareLoop `.env` (default: `http://localhost:7860/client`).

## Notes
- This is the local test path. Production telephony bridging (Twilio/Telnyx/etc.) should be added as a dedicated Pipecat transport workflow.

## Troubleshooting: Bot connects but does not respond

- If the browser connects but no speech is returned, check terminal logs for provider auth errors.
- A common failure is Deepgram `HTTP 401`, which means `DEEPGRAM_API_KEY` is invalid or still a placeholder.
- The bot now validates required keys at startup and exits early if placeholders are detected.

Quick check:

```bash
python - <<'PY'
from dotenv import dotenv_values
cfg = dotenv_values('.env')
for k in ['DEEPGRAM_API_KEY','OPENAI_API_KEY','CARTESIA_API_KEY']:
  v = cfg.get(k, '')
  print(k, 'OK' if v and 'your_' not in v.lower() else 'INVALID')
PY
```
