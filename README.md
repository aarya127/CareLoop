# CareLoop — Run Locally

## Prerequisites
- Node.js 20 LTS or newer (the repo requires `>=20`)
- pnpm 10 (this is a pnpm workspace using the `workspace:*` protocol; npm/yarn
  cannot install it). Enable via `corepack enable`.

## 1) Install dependencies
```bash
pnpm install
```

## 2) Configure environment
Create a `.env` file in the project root (or copy from `.env.example` if present).
All secrets are read from the environment (`.env` locally; a secrets manager in
deployed environments) — do not commit secrets to the repo.

Minimum values commonly needed:
```env
APP_BASE_URL=http://localhost:3000
BASE_URL=http://localhost:3000
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

If you use the AI Phone Assistant (Twilio + ElevenLabs), also set:
```env
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM

TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+15555555555

# Optional: log level for backend services
LOG_LEVEL=info
```

## 3) Generate Prisma client (if using database features)
```bash
npx prisma generate
```

## 4) Start development server
```bash
pnpm dev
```

Open: http://localhost:3000

If port 3000 is already in use, Next.js will automatically pick another port
(for example `http://localhost:3001` or `http://localhost:3002`) and print it in the terminal.

<!-- Pipecat Local Test instructions removed -->

## Production
```bash
pnpm build
pnpm start
```

## Run tests
```bash
pnpm test            # all workspaces
pnpm --filter @careloop/api test
```

# CareLoop
