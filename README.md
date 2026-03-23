# Clean Periodic Table Frontend

Next.js frontend for integrating with:

- Auth API (`/login`, `/register`, `/validate-token`)
- Backend API (`/elements`)

## Repositories

- Frontend: https://github.com/ZippyBonhTM/clean-periodic-table-frontend
- Backend: https://github.com/ZippyBonhTM/clean-periodic-table-backend
- Auth: https://github.com/ZippyBonhTM/clean-auth

## Environment

Create `.env.local` (or `.env`) based on `.env.example`:

```bash
NEXT_PUBLIC_AUTH_API_URL=http://localhost:3002
NEXT_PUBLIC_BACKEND_API_URL=http://localhost:3001
NEXT_PUBLIC_SITE_URL=http://localhost:3000
AUTH_API_URL=http://localhost:3002
BACKEND_API_URL=http://localhost:3001
ADMIN_AUTHZ_SOURCE=legacy-auth
```

Notes:

- `NEXT_PUBLIC_*` values are used by the browser bundle.
- `AUTH_API_URL`, `BACKEND_API_URL`, and optional `ADMIN_API_URL` are used by Next server routes and SSR guards.
- `ADMIN_AUTHZ_SOURCE` supports `legacy-auth`, `auto`, and `backend`.
- Keep `legacy-auth` as the production-safe default until the product backend admin authority is validated.

## Run

```bash
npm install
npm run dev
```

Frontend runs on `http://localhost:3000` by default.

## Deploy

- Vercel guide (recommended): `DEPLOY_VERCEL.md`
- Railway guide (optional): `DEPLOY_RAILWAY.md`

## Docs

- Chemical system context: `docs/chemical-system-context.md`
- Chemical system architecture: `docs/chemical-system-architecture.md`

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

- `/login`: auth form
- `/register`: registration form
- `/periodic-table`: classic table entry
- `/search`: table/search experience
