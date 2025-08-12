
# Run + Lift — Next.js (no auth)

Stack: Next.js 14 (App Router, TS), Tailwind, Prisma (Railway Postgres), Recharts.

## Setup
```bash
pnpm i   # or npm i / yarn
cp .env.example .env
# paste your DATABASE_URL in .env
npx prisma db push
npm run dev
```

## Deploy (Railway)
- Push to GitHub → Railway → New Project → Deploy from GitHub
- Add env var `DATABASE_URL`
- On first boot, Prisma will create tables.
