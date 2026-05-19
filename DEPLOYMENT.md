# Deployment

This repository has two deployable apps:

- `aisupport-frontend`: React + Vite frontend
- `aisupport-backend`: Node.js + Express API

## Frontend

Deploy `aisupport-frontend` to Vercel, Netlify, or any static host.

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
AWS_ACCOUNT_ID=...
RAW_BUCKET=...
ANALYTICS_BUCKET=...
BEDROCK_MODEL_ID=anthropic.claude-3-haiku-20240307-v1:0
BEDROCK_AGENT_ID=...
BEDROCK_AGENT_ALIAS_ID=...
QUICKSIGHT_USER_ARN=...
QS_DASHBOARD_SUPPORT_AGENT=...
QS_DASHBOARD_TEAM_MANAGER=...
QS_DASHBOARD_BUSINESS_EXECUTIVE=...
```

Prefer AWS CLI profiles, IAM roles, or platform-managed secrets for AWS credentials. Do not commit `AWS_ACCESS_KEY_ID` or `AWS_SECRET_ACCESS_KEY` to the repository.

## Personal AWS Infrastructure

The Terraform stack in `aisupport-backend/terraform` creates the personal-account AWS resources for this app:

- Private S3 raw and analytics buckets
- Amazon Bedrock Agent and alias
- Backend runtime IAM policy for S3, Bedrock, and QuickSight embed access

It intentionally does not create Lambda or CloudWatch resources.

```bash
cd aisupport-backend/terraform
copy terraform.tfvars.example terraform.tfvars
terraform init
terraform plan
terraform apply
terraform output
```

Copy the Terraform outputs into `aisupport-backend/.env`, then attach `backend_runtime_policy_arn` to the IAM user or role used by the backend.

## Deployment Order

1. Create a MongoDB Atlas database and copy the connection string.
2. Deploy the backend with the environment variables above.
3. Deploy the frontend.
4. Set `FRONTEND_URL` in the backend to the final frontend URL.
5. Verify the backend health endpoint at `/api/health`.
