# AI-Support-Ticket-Intelligence

AI-powered customer support intelligence platform using React, Node.js, AWS Bedrock, DynamoDB, Lambda, Athena, and QuickSight.

## Project Overview

AI Support Ticket Intelligence is an enterprise support platform for customer ticket intake, AI-assisted triage, role-based operations, and executive analytics. It provides separate customer and organization portals, JWT-based authentication, AI chatbot assistance, ticket management, dataset upload workflows, and embedded analytics for support teams.

## Key Features

- Separated Customer Portal and Organization Portal
- Customer ticket creation, tracking, history, and AI assistance
- Organization role selection for Support Agent, Team Manager, and Business Executive
- AI-powered ticket summaries, priority signals, sentiment, and smart support workflows
- Team Manager dataset upload and analytics refresh workflow
- Executive dashboards and QuickSight-ready analytics pages
- Premium React UI with glassmorphism, animated navigation, and responsive layouts
- JWT authentication with session persistence
- AWS-oriented architecture for Bedrock, DynamoDB, Lambda, Athena, S3, and QuickSight

## Tech Stack

**Frontend**
- React
- Vite
- Tailwind CSS
- Framer Motion
- Lucide React
- Recharts

**Backend**
- Node.js
- Express
- JWT
- bcryptjs
- MongoDB/Mongoose for local application persistence
- AWS SDK

**AWS Services**
- Amazon Bedrock
- Amazon DynamoDB
- AWS Lambda
- Amazon S3
- Amazon Athena
- Amazon QuickSight
- AWS IAM
- Terraform

## Architecture Workflow

1. Customer or organization user signs in through the correct portal.
2. Customer users raise and track support tickets.
3. Organization users select one of three workspaces: Support Agent, Team Manager, or Business Executive.
4. Backend APIs handle authentication, tickets, analytics, datasets, reports, chatbot requests, and QuickSight embed URLs.
5. AI services enrich support workflows with summaries, sentiment, root cause, suggested resolution, and chatbot responses.
6. Dataset uploads feed operational and executive analytics.
7. AWS services support scalable AI processing, data storage, analytics querying, and dashboard visualization.

## Folder Structure

```text
AI-Support-Ticket-Intelligence/
├── aisupport/                 # Frontend React + Vite app
│   ├── src/
│   ├── package.json
│   └── .env.example
├── aisupport-backend/         # Backend Node.js + Express API
│   ├── src/
│   ├── terraform/
│   ├── package.json
│   └── .env.example
├── aisupport-frontend/        # Legacy/alternate frontend copy, if retained
├── README.md
├── .gitignore
└── package.json
```

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/lingabarani/AI-Support-Ticket-Intelligence.git
cd AI-Support-Ticket-Intelligence
```

### 2. Install frontend dependencies

```bash
cd aisupport
npm install
```

### 3. Install backend dependencies

```bash
cd ../aisupport-backend
npm install
```

## Environment Variables

Never commit real `.env` files. Use the example files as templates.

### Frontend

```bash
cd aisupport
copy .env.example .env
```

Required:

```env
VITE_API_BASE_URL=http://127.0.0.1:5000
```

### Backend

```bash
cd aisupport-backend
copy .env.example .env
```

Configure values for:

- `PORT`
- `FRONTEND_URL`
- `MONGODB_URI` or your database connection
- `JWT_SECRET`
- AWS region/account placeholders
- Bedrock, S3, Athena, Lambda, and QuickSight identifiers
- Optional AI provider keys

## Run Locally

### Start backend

```bash
cd aisupport-backend
npm run dev
```

Backend default URL:

```text
http://127.0.0.1:5000
```

Health check:

```text
http://127.0.0.1:5000/api/health
```

### Start frontend

```bash
cd aisupport
npm run dev
```

Frontend default URL:

```text
http://127.0.0.1:5173
```

## AWS Services Used

- **Amazon Bedrock**: AI assistant, support intelligence, summaries, and response generation
- **DynamoDB**: AWS-native operational data layer
- **Lambda**: Serverless processing and automation workflows
- **S3**: Dataset and artifact storage
- **Athena**: Query layer for analytics datasets
- **QuickSight**: Embedded dashboards and executive reporting
- **IAM**: Secure service permissions
- **Terraform**: Infrastructure as code

## Screenshots

Add screenshots here after uploading UI images.

```text
screenshots/
├── landing-page.png
├── customer-portal.png
├── organization-role-selection.png
├── support-agent-dashboard.png
├── team-manager-dashboard.png
└── executive-dashboard.png
```

## Future Enhancements

- Production Google OAuth integration
- Full DynamoDB persistence layer
- Lambda-based ticket enrichment pipeline
- Athena-backed analytics warehouse
- Production QuickSight embed domain hardening
- CI/CD with GitHub Actions
- Automated tests for frontend and backend
- Docker Compose for local development
- Role-based access policies across all API routes

## GitHub Push Commands

```bash
git init
git add .
git commit -m "Initial commit - AI Support Ticket Intelligence Platform"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/AI-Support-Ticket-Intelligence.git
git push -u origin main
```

For your repository:

```bash
git remote add origin https://github.com/lingabarani/AI-Support-Ticket-Intelligence.git
git push -u origin main
```
