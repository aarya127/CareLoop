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

<!-- Pipecat Local Test instructions removed -->

## Production
```bash
npm run build
npm run start
```

# CareLoop
