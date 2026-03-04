# Frontend

Next.js frontend for integrating with:

- Auth API (`/login`, `/register`, `/validate-token`)
- Backend API (`/elements`)

## Environment

Create `.env.local` (or `.env`) based on `.env.example`:

```bash
NEXT_PUBLIC_AUTH_API_URL=http://localhost:3002
NEXT_PUBLIC_BACKEND_API_URL=http://localhost:3001
```

## Run

```bash
npm install
npm run dev
```

Frontend runs on `http://localhost:3000` by default.

## Deploy

- Vercel guide (recommended): `DEPLOY_VERCEL.md`
- Railway guide (optional): `DEPLOY_RAILWAY.md`

## Structure

- `src/components/atoms`
- `src/components/molecules`
- `src/components/organisms`
- `src/components/templates`
- `src/components/shared/header`
- `src/components/shared/footer`
- `src/shared/api`
- `src/shared/hooks`
- `src/shared/storage`
- `src/shared/config`

Pages:

- `/login`: simple auth form (client-side)
- `/register`: simple registration form (client-side)
- `/`: elements list fetched from backend with bearer token
