# Deploy Frontend on Railway (Optional)

Use this only if you intentionally want frontend outside Vercel.

## Publish image

`NEXT_PUBLIC_*` values are baked at build time.

```bash
docker login
cd /home/zippy/clean-periodic-table/frontend
NEXT_PUBLIC_AUTH_API_URL=https://<AUTH_PUBLIC_DOMAIN> \
NEXT_PUBLIC_BACKEND_API_URL=https://<BACKEND_PUBLIC_DOMAIN> \
npm run docker:publish -- <DOCKERHUB_USER> <VERSION_TAG>
```

Image names:

- `<DOCKERHUB_USER>/clean-periodic-table-frontend:<VERSION_TAG>`
- `<DOCKERHUB_USER>/clean-periodic-table-frontend:latest`

## Railway env vars

Use `/home/zippy/clean-periodic-table/frontend/railway.env.example`.

If URLs change, rebuild and repush the image.
