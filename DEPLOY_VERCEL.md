# Deploy Frontend (Vercel)

Recommended target for this Next.js app.

## 1) Import project

- In Vercel, import this repository directly.
- Framework preset: `Next.js`

## 2) Environment variables (Vercel project)

Set these variables in Vercel (Production, and Preview if needed):

- `NEXT_PUBLIC_AUTH_API_URL=https://<AUTH_PUBLIC_DOMAIN>`
- `NEXT_PUBLIC_BACKEND_API_URL=https://<BACKEND_PUBLIC_DOMAIN>`
- `NEXT_PUBLIC_SITE_URL=https://<YOUR_CANONICAL_SITE_DOMAIN>`

`NEXT_PUBLIC_SITE_URL` should always point to the canonical domain you want search engines to index.

- Before a custom domain exists, it can point to your production `vercel.app` URL.
- After a custom domain is connected, change it to `https://<YOUR_CUSTOM_DOMAIN>`.
- The app uses this value for canonical metadata, `sitemap.xml`, and `robots.txt`.

## 3) Build settings

Defaults are usually fine. If needed:

- Install Command: `npm ci`
- Build Command: `npm run build`
- Output: `.next` (managed by Vercel)

## 4) Domain and CORS sync

After Vercel gives your frontend URL/domain, update Railway env vars:

- Auth service: `CORS_ORIGINS=https://<YOUR_VERCEL_DOMAIN>`
- Backend service: `CORS_ORIGINS=https://<YOUR_VERCEL_DOMAIN>`

If you use a custom domain, prefer that domain in CORS.

## 5) Notes

- Vercel is the best compatibility path for Next.js runtime behavior.
- Keep Auth and Backend on Railway (containerized services).
- If using preview deployments, decide whether to include preview domains in CORS.
