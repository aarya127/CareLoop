# CareLoop — Run Locally

## Prerequisites
- Node.js 18+ (recommended: Node.js 20 LTS)
- npm

## 1) Install dependencies
```bash
npm install
```

## 2) Configure environment
Create a `.env` file in the project root (or copy from `.env.example` if present).

Minimum values commonly needed:
```env
APP_BASE_URL=http://localhost:3000
DATABASE_URL=postgresql://user:password@localhost:5432/careloop?schema=public
```

If you use Google Calendar features, also set:
```env
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/oauth/google/callback
ENCRYPTION_KEY=a_long_random_secret
DEMO_USER_ID=demo-user
```

## 3) Generate Prisma client (if using database features)
```bash
npx prisma generate
```

## 4) Start development server (recommended: Turbopack)
```bash
npm run dev:turbo
```

Alternative:
```bash
npm run dev
```

Open: http://localhost:3000

## Pipecat Voice AI (Local Test)

CareLoop includes a local Pipecat test harness in `pipecat-agent/`.

1. Configure and start the Pipecat bot:

```bash
cd pipecat-agent
cp .env.example .env
# Fill DEEPGRAM_API_KEY, OPENAI_API_KEY, CARTESIA_API_KEY
python bot.py
```

2. (Optional) Add these values to CareLoop `.env`:

```env
PIPECAT_BASE_URL=http://localhost:7860
PIPECAT_HEALTH_URL=http://localhost:7860
PIPECAT_CLIENT_URL=http://localhost:7860/client
```

3. In CareLoop, open `Admin -> AI Assistant` and use the **Pipecat Local Test** panel:
- `Check Pipecat` verifies local reachability
- `Open Pipecat Client` launches the Pipecat WebRTC client

Integration guide: `docs/pipecat-integration.md`

## Production
```bash
npm run build
npm run start
```

# CareLoop
