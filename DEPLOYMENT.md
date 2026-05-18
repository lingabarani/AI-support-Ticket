# Deployment

This repository has two deployable apps:

- `aisupport`: React + Vite frontend
- `aisupport-backend`: Node.js + Express API

## Frontend

Deploy `aisupport` to Vercel, Netlify, or any static host.

Build command:

```bash
npm run build
```

Publish directory:

```bash
dist
```

The app includes SPA fallback config for Vercel (`vercel.json`) and Netlify (`netlify.toml`).

## Backend

Deploy `aisupport-backend` to Render, Railway, Fly.io, or another Node host.

Start command:

```bash
npm start
```

Required environment variables:

```bash
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
JWT_SECRET=replace_with_a_strong_secret
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://your-frontend-domain.example
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
BEDROCK_MODEL_ID=anthropic.claude-3-sonnet-20240229-v1:0
S3_BUCKET_NAME=...
QUICKSIGHT_ACCOUNT_ID=...
QUICKSIGHT_DASHBOARD_ID=...
```

## Deployment Order

1. Create a MongoDB Atlas database and copy the connection string.
2. Deploy the backend with the environment variables above.
3. Deploy the frontend.
4. Set `FRONTEND_URL` in the backend to the final frontend URL.
5. Verify the backend health endpoint at `/api/health`.
