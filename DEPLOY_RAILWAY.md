# Deploy Frontend on Railway (Optional)

Use this only if you intentionally want frontend outside Vercel.

## Publish image

`NEXT_PUBLIC_*` values are baked at build time.
Runtime-only server envs such as `AUTH_API_URL`, `BACKEND_API_URL`, `ARTICLE_API_URL`, and `ADMIN_AUTHZ_SOURCE`
are read by the Next server inside the running container.

```bash
docker login
cd /home/zippy/clean-periodic-table-frontend
NEXT_PUBLIC_AUTH_API_URL=https://<AUTH_PUBLIC_DOMAIN> \
NEXT_PUBLIC_BACKEND_API_URL=https://<BACKEND_PUBLIC_DOMAIN> \
NEXT_PUBLIC_ARTICLE_API_URL=https://<ARTICLE_PUBLIC_DOMAIN> \
npm run docker:publish -- <DOCKERHUB_USER> <VERSION_TAG>
```

Image names:

- `<DOCKERHUB_USER>/clean-periodic-table-frontend:<VERSION_TAG>`
- `<DOCKERHUB_USER>/clean-periodic-table-frontend:latest`

## Railway env vars

Use `/home/zippy/clean-periodic-table-frontend/railway.env.example`.

Recommended runtime envs:

- `AUTH_API_URL=https://<AUTH_PRIVATE_OR_PUBLIC_DOMAIN>`
- `BACKEND_API_URL=https://<BACKEND_PRIVATE_OR_PUBLIC_DOMAIN>`
- `ARTICLE_API_URL=https://<ARTICLE_PRIVATE_OR_PUBLIC_DOMAIN>` optional but recommended when Article routes are enabled
- `ADMIN_API_URL=` optional; only if admin endpoints move off the main backend host
- `ADMIN_AUTHZ_SOURCE=legacy-auth` for compatibility

Recommended rollout:

1. keep `ADMIN_AUTHZ_SOURCE=legacy-auth` in production while validating the backend admin contract
2. move staging to `ADMIN_AUTHZ_SOURCE=auto`
3. after validation, move production to `ADMIN_AUTHZ_SOURCE=auto`
4. only then consider `ADMIN_AUTHZ_SOURCE=backend`

If `NEXT_PUBLIC_AUTH_API_URL`, `NEXT_PUBLIC_BACKEND_API_URL`, or `NEXT_PUBLIC_ARTICLE_API_URL` changes, rebuild and repush the image.
