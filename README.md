# CareLoop — Run Locally

## Prerequisites
- Node.js 18+ (recommended: Node.js 20 LTS)
- npm

## 1) Install dependencies
```bash
npm install
```

If you are in the parent folder (`/Users/.../Desktop/CareLoop`), first run:
```bash
cd CareLoop
```

## 2) Configure environment
Create a `.env` file in the project root (or copy from `.env.example` if present).

You can also use `key.txt` in the project root for API tokens. The backend now
reads secrets from `key.txt` first, then falls back to `.env`.

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

`key.txt` format example:
```txt
ELEVENLABS_API_KEY=your_elevenlabs_api_key
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token
```
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

If port 3000 is already in use, Next.js will automatically pick another port
(for example `http://localhost:3001` or `http://localhost:3002`) and print it in the terminal.

<!-- Pipecat Local Test instructions removed -->

## Production
```bash
npm run build
npm run start
```

# CareLoop
