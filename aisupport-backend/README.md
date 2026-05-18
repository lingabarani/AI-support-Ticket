# AI-Powered Customer Experience & Business Intelligence Platform

## Tech Stack
- **Frontend:** React.js + Vite + Tailwind CSS + Recharts + Framer Motion
- **Backend:** Node.js + Express.js + MongoDB + JWT Auth
- **AI:** Amazon Bedrock (Claude 3 Sonnet)
- **Analytics:** Amazon QuickSight (embed placeholders)
- **Storage:** Amazon S3
- **Infra:** Terraform (AWS ECS, Lambda, CloudFront)

---

## Project Structure

```
aisupport/                          ← Frontend (React + Vite)
├── src/
│   ├── components/
│   │   ├── Layout.jsx              ← Main layout wrapper
│   │   ├── Sidebar.jsx             ← Role-aware sidebar nav
│   │   ├── Topbar.jsx              ← Search + notifications + profile
│   │   └── KpiCard.jsx             ← Reusable KPI metric card
│   ├── context/
│   │   └── AuthContext.jsx         ← JWT auth context + role state
│   ├── data/
│   │   └── dummyData.js            ← All dummy data / charts data
│   ├── pages/
│   │   ├── Login.jsx               ← Login page
│   │   ├── RoleSelect.jsx          ← Role selection after login
│   │   ├── AgentDashboard.jsx      ← Support Agent dashboard
│   │   ├── MyTickets.jsx           ← Ticket list with filters
│   │   ├── TicketDetail.jsx        ← Ticket + AI analysis view
│   │   ├── AIAnalysis.jsx          ← Full AI insights page
│   │   ├── KnowledgeBase.jsx       ← KB articles
│   │   ├── Notifications.jsx       ← Notifications center
│   │   ├── AgentPerformance.jsx    ← Agent metrics
│   │   ├── ManagerDashboard.jsx    ← Team manager dashboard
│   │   ├── ManagerReports.jsx      ← Reports & analytics
│   │   ├── ExecutiveDashboard.jsx  ← Executive KPIs + QuickSight
│   │   ├── ExecutiveInsights.jsx   ← AI business insights
│   │   ├── CustomerHome.jsx        ← Customer portal home
│   │   ├── RaiseTicket.jsx         ← Create ticket form
│   │   ├── CustomerTickets.jsx     ← Customer ticket list
│   │   ├── LiveChat.jsx            ← Chat interface
│   │   ├── FAQ.jsx                 ← Knowledge base FAQ
│   │   ├── Feedback.jsx            ← CSAT feedback
│   │   ├── AdminDashboard.jsx      ← Admin overview
│   │   ├── UserManagement.jsx      ← CRUD users
│   │   ├── SecurityLogs.jsx        ← Audit logs
│   │   └── AdminSettings.jsx       ← API & platform config
│   ├── App.jsx                     ← All routes
│   └── index.css                   ← Global styles + design tokens

aisupport-backend/                  ← Backend (Node.js + Express)
├── src/
│   ├── controllers/
│   │   ├── auth.controller.js      ← Login, register, JWT
│   │   ├── ticket.controller.js    ← Ticket CRUD
│   │   └── ai.controller.js        ← Bedrock AI calls
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── ticket.routes.js
│   │   ├── user.routes.js
│   │   ├── notification.routes.js
│   │   ├── analytics.routes.js
│   │   ├── report.routes.js        ← QuickSight embed URL
│   │   └── ai.routes.js            ← AI API endpoints
│   ├── middleware/
│   │   └── auth.middleware.js      ← JWT protect + authorize
│   ├── models/
│   │   ├── User.model.js
│   │   ├── Ticket.model.js
│   │   ├── Notification.model.js
│   │   └── AIInsight.model.js
│   └── server.js
├── terraform/
│   └── main.tf                     ← AWS infra (S3, ECS, Lambda, CloudFront)
└── .env.example
```

---

## User Roles & Dashboards

| Role | Default Route | Access |
|------|--------------|--------|
| Support Agent | /agent | Tickets, AI analysis, Knowledge Base |
| Team Manager | /manager | Team overview, SLA, Reports |
| Business Executive | /executive | KPIs, Churn, Revenue Risk, QuickSight |
| System Admin | /admin | Users, Roles, Security Logs, API Config |
| Customer Portal User | /customer | Raise ticket, Track, Chat, FAQ |

---

## Setup

### Frontend
```bash
cd aisupport
npm install
npm run dev        # http://localhost:5173
npm run build      # Production build
```

### Backend
```bash
cd aisupport-backend
cp .env.example .env   # Fill in your credentials
npm install
npm run dev            # http://localhost:5000
```

### AWS Terraform
```bash
cd aisupport-backend/terraform
terraform init
terraform plan
terraform apply
```

---

## AI API Endpoints (Bedrock)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/ai/analyze-ticket | Full ticket AI analysis |
| POST | /api/ai/summarize | Summarize text |
| POST | /api/ai/sentiment | Sentiment analysis |
| POST | /api/ai/recommendation | Business recommendations |
| POST | /api/ai/suggest-response | Agent reply suggestion |

---

## Amazon QuickSight Integration
- Executive Dashboard → `GET /api/reports/quicksight-embed` returns embed URL
- Uses `@aws-sdk/client-quicksight` `GetDashboardEmbedUrlCommand`
- Render with `<iframe src={embedUrl} />` in `ExecutiveDashboard.jsx`

---

## Deployment
- **Frontend:** Deploy `dist/` folder to Vercel or AWS CloudFront/S3
- **Backend:** Deploy to Render, Railway, or AWS ECS (Fargate)
- **DB:** MongoDB Atlas free tier → set `MONGODB_URI` in env
