# SahiScreen

**AI-Powered CV Shortlisting Platform for Pakistan's HR Market**

> Screen 100 CVs in 5 minutes. Built for Pakistani HR teams and SMEs.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database](#database)
- [Architecture](#architecture)
- [Development Workflow](#development-workflow)
- [Deployment](#deployment)
- [API Reference](#api-reference)
- [Security](#security)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

SahiScreen is a multi-tenant SaaS platform that automates CV screening for Pakistani companies. HR teams upload CVs, define job requirements, and receive a ranked shortlist with AI-generated scores and written justifications — in minutes, not days.

**Core Capabilities**

- Dual AI engine routing: Google Gemini (Essential plan) and Anthropic Claude (Premium plan)
- Anti-gaming detection for padded or AI-generated CVs
- Pakistani context scoring: understands local institutions, employers, and qualifications
- Multi-tenant architecture with row-level security enforced at the database level
- PayFast subscription billing with recurring payment support
- 8-trigger automated email notification system

**Target Market**

Pakistani companies with 15–300 employees that receive 100–400 CVs per job opening and lack the resources for manual screening at scale.

---

## Tech Stack

| Layer           | Technology                                       |
| --------------- | ------------------------------------------------ |
| Frontend        | Next.js 14 (App Router), TypeScript, TailwindCSS |
| UI Components   | ShadCN UI, Lucide React                          |
| Backend         | Next.js API Routes (Serverless)                  |
| Database        | Supabase (PostgreSQL + Row Level Security)       |
| Authentication  | Supabase Auth (Email/Password)                   |
| File Storage    | Supabase Storage (Private Buckets)               |
| AI — Essential  | Google Gemini API                                |
| AI — Premium    | Anthropic Claude API (Haiku)                     |
| Payments        | PayFast (Recurring Billing)                      |
| Email           | Resend                                           |
| Animations      | Framer Motion                                    |
| Deployment      | Vercel                                           |
| Version Control | GitHub (Private)                                 |

---

## Project Structure

```
sahiscreen/
│
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication routes (unauthenticated)
│   │   ├── login/
│   │   └── register/
│   │
│   ├── (dashboard)/              # Protected routes (authenticated)
│   │   ├── dashboard/            # Home dashboard
│   │   ├── jobs/                 # Job management
│   │   ├── candidates/           # CV upload and screening results
│   │   ├── billing/              # Subscription and payment management
│   │   └── settings/             # Company profile and user management
│   │
│   ├── (marketing)/              # Public-facing pages
│   │   └── page.tsx              # Landing page
│   │
│   ├── api/                      # API routes (server-side only)
│   │   ├── auth/                 # Authentication handlers
│   │   ├── payfast/              # Payment initiation and webhook
│   │   ├── screen-cv/            # AI screening endpoint
│   │   └── extract-cv/           # CV text extraction endpoint
│   │
│   ├── layout.tsx                # Root layout
│   └── globals.css               # Global styles
│
├── components/
│   ├── ui/                       # ShadCN base components
│   ├── landing/                  # Landing page section components
│   ├── dashboard/                # Dashboard-specific components
│   └── shared/                   # Reusable components across all pages
│
├── lib/                          # Utility functions and service clients
│   ├── supabase.ts               # Supabase client (browser)
│   ├── supabase-server.ts        # Supabase client (server-side)
│   ├── ai-router.ts              # Plan-based AI model routing logic
│   ├── email.ts                  # Resend email service wrapper
│   ├── payfast.ts                # PayFast signature and API helpers
│   └── utils.ts                  # General utility functions
│
├── types/                        # TypeScript type definitions
│   ├── database.ts               # Supabase database types
│   ├── api.ts                    # API request and response types
│   └── index.ts                  # Shared application types
│
├── public/
│   └── images/                   # Static assets and images
│
├── .env.local                    # Local environment variables (never commit)
├── .env.example                  # Environment variable template (commit this)
├── .gitignore
├── middleware.ts                 # Route protection and session handling
├── next.config.ts                # Next.js configuration
├── tailwind.config.ts            # Tailwind + brand color configuration
├── tsconfig.json
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 18.17 or higher
- npm 9 or higher
- Git
- A Supabase account
- A Vercel account (for deployment)

### Local Setup

**1. Clone the repository**

```bash
git clone https://github.com/YOUR_USERNAME/sahiscreen.git
cd sahiscreen
```

**2. Install dependencies**

```bash
npm install
```

**3. Configure environment variables**

```bash
cp .env.example .env.local
```

Fill in all required values in `.env.local` — see [Environment Variables](#environment-variables) section.

**4. Run the development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Variables

Copy `.env.example` to `.env.local` and populate the following:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI APIs (server-side only — never prefix with NEXT_PUBLIC_)
ANTHROPIC_API_KEY=
GOOGLE_AI_API_KEY=

# PayFast
PAYFAST_MERCHANT_ID=
PAYFAST_MERCHANT_KEY=
PAYFAST_PASSPHRASE=
PAYFAST_SANDBOX=true

# Email
RESEND_API_KEY=

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=SahiScreen
```

> **Security note:** AI API keys, PayFast credentials, and the Supabase service role key must never be prefixed with `NEXT_PUBLIC_`. These are server-side only and must never appear in client-side JavaScript bundles.

---

## Database

### Schema Overview

The database consists of 7 core tables, all scoped to `company_id` with Row Level Security enforced at the PostgreSQL level.

| Table               | Purpose                                                   |
| ------------------- | --------------------------------------------------------- |
| `companies`         | Tenant registry — one row per registered company          |
| `users`             | User accounts linked to a company with role assignments   |
| `subscriptions`     | Plan state machine: Trial → Active → Paused → Cancelled   |
| `jobs`              | Job postings created by HR teams                          |
| `cv_uploads`        | CV file registry with extraction status and parsed text   |
| `screening_results` | AI scores, justifications, and shortlist decisions per CV |
| `payments`          | Full PayFast transaction history                          |

### Migrations

All schema migrations are managed via Supabase SQL editor. Migration files are maintained in order and must be run sequentially on any new environment.

### Row Level Security

RLS is enabled on every table without exception. All policies enforce `company_id` equality — no cross-tenant data access is possible at the API or database level. Any new table added to the schema must have RLS enabled and a company-scoped policy before being used in production.

---

## Architecture

### Multi-Tenancy

Each company is a fully isolated tenant. Company isolation is enforced at three levels:

1. **Database** — PostgreSQL RLS policies on every table
2. **API** — `company_id` extracted from authenticated session on every request
3. **Storage** — CV files stored in private buckets with signed URLs scoped to the uploading company

### AI Model Routing

The plan tier is read from the database on every screening request — server-side, not from the client. Essential plan accounts are routed to Google Gemini. Premium plan accounts are routed to Anthropic Claude. This routing cannot be bypassed from the client side.

### Subscription State Machine

```
Registration → Trial (14 days, 50 CVs)
                   │
                   ├── Payment success → Active
                   ├── Trial expires  → Expired (read-only)
                   └── Manual cancel  → Cancelled

Active → Paused → Active
Active → Cancelled
```

### Payment Flow

PayFast hosted checkout is used for all payments. The webhook endpoint verifies the ITN signature server-side before any subscription state change is applied. Stored tokens are used for recurring monthly charges via a Supabase Edge Function.

---

## Development Workflow

### Branch Strategy

```
main          — production-ready code only
develop       — integration branch
feature/*     — individual feature branches
fix/*         — bug fix branches
```

### Commit Convention

```
feat:     new feature
fix:      bug fix
refactor: code change without feature or fix
docs:     documentation only
chore:    build process or dependency updates
```

Example:

```
feat: add PayFast webhook handler with ITN signature verification
fix: resolve RLS policy blocking admin panel queries
docs: update environment variable reference in README
```

### Weekly Milestone Delivery

At the end of each development week, a milestone delivery is sent to the client containing a screen recording or live demo link of completed work. The client has 2 business days to provide written feedback. No response within 2 business days constitutes approval of that milestone.

---

## Deployment

### Production Environment

| Service      | Provider                      | Purpose                            |
| ------------ | ----------------------------- | ---------------------------------- |
| Hosting      | Vercel                        | Next.js serverless deployment      |
| Database     | Supabase (Production project) | Separate from development project  |
| Domain       | Custom domain via Vercel      | HTTPS enforced, HTTP redirected    |
| File Storage | Supabase Storage              | Private buckets, production bucket |

### Deployment Steps

1. All environment variables configured in Vercel dashboard
2. GitHub main branch connected to Vercel auto-deploy
3. Production Supabase project created and migrations run separately
4. Custom domain configured with SSL
5. PayFast credentials switched from sandbox to live mode
6. Smoke test performed on every page after every production deploy

### Production Checklist Before Go-Live

- [ ] All API keys rotated to production values
- [ ] Supabase RLS penetration test passed
- [ ] PayFast live payment end-to-end tested
- [ ] All 8 email triggers tested on production domain
- [ ] CV files confirmed inaccessible via direct URL
- [ ] No API keys visible in client-side JS bundle
- [ ] 50 CVs processed through batch screener without error
- [ ] Admin panel confirmed accessible only to authorised email

---

## API Reference

All API routes are server-side only. Authentication is required on all endpoints except PayFast webhook.

| Method | Route                   | Description                                   |
| ------ | ----------------------- | --------------------------------------------- |
| `POST` | `/api/extract-cv`       | Extract text from uploaded CV file            |
| `POST` | `/api/screen-cv`        | Screen a single CV against a job description  |
| `POST` | `/api/payfast/initiate` | Generate PayFast payment payload and redirect |
| `POST` | `/api/payfast/webhook`  | Receive and verify PayFast ITN notification   |

Full request and response schemas are documented in `types/api.ts`.

---

## Security

### Practices in Place

- All AI API keys and PayFast credentials are server-side only
- Supabase service role key never exposed to client
- RLS enforced at database level on every table
- CV files stored in private Supabase Storage buckets
- Signed URLs for file access are time-limited and company-scoped
- PayFast webhook ITN signatures verified server-side before any state change
- Input sanitization on all text fields
- Supabase parameterized queries prevent SQL injection by default

### Reporting a Vulnerability

If you discover a security vulnerability, contact the development team directly via WhatsApp or email. Do not open a public GitHub issue for security matters.

---

## Contributing

This is a private client project. External contributions are not accepted. All development is managed by Waleed AN as the sole developer under the terms of the signed Statement of Work between SahiHR and Waleed AN (May 2026).

---

## License

This project and all source code is the intellectual property of SahiHR (Asad Ali Sahi) upon receipt of full and final payment as defined in the Statement of Work dated May 2026. During the development period, all rights are retained by the Developer (Waleed AN).

Unauthorized copying, distribution, or use of this codebase is strictly prohibited.

---

<div align="center">

Built with ❤️ in Pakistan 🇵🇰

**SahiScreen** · Powered by Claude AI + Google Gemini · © 2026 SahiHR

</div>
