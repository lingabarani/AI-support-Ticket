# AI-Support-Ticket-Intelligence

AI-Driven Customer Support Ticket Intelligence Framework using Amazon Bedrock, Amazon QuickSight, Terraform, React, Node.js, and MongoDB Atlas.

## AI Support Ticket Platform

Full-stack AI-powered support ticket platform with a React/Vite frontend and a Node.js/Express backend.

## Structure

```text
aisupport-frontend/   React + Vite + Tailwind customer/support dashboards
aisupport-backend/    Express API, MongoDB models, JWT auth, AI/AWS routes
DEPLOYMENT.md         Deployment notes
vercel.json           Root Vercel config for frontend deployment
.env.example          Root local environment variable template
```

## Common Commands

```bash
npm run build
npm run dev:frontend
npm run dev:backend
```

The local `.env` file is ignored by git. Use it for machine-specific URLs or credentials, and keep `.env.example` as the shareable template.
