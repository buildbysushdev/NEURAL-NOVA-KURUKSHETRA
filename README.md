# Kurukshetra PS20: Agentic Disaster Relief System
> **Team Neural Nova | Problem Statement 20**  
> Autonomous multi-agent coordination system for real-time disaster triage, inventory allocation, dynamic resource re-balancing, and transparent emergency audit trails.

---

##  Table of Contents
1. [Architecture Overview](#-architecture-overview)
2. [Tech Stack](#-tech-stack)
3. [Environment Variables](#-environment-variables)
4. [Supabase Database & Edge Functions Setup](#-supabase-database--edge-functions-setup)
   - [Setting Secrets via CLI (`supabase secrets set`)](#setting-secrets-via-cli)
   - [Deploying Edge Functions](#deploying-edge-functions)
   - [Database Webhooks Configuration](#database-webhooks-configuration)
5. [Vercel Deployment Guide](#-vercel-deployment-guide)
6. [API Routes Reference](#-api-routes-reference)
7. [Testing & Verification](#-testing--verification)

---

##  Architecture Overview

```
[Citizen / Sensors / Responders]
               │
               ▼ (POST /api/incidents or Supabase Client)
     ┌───────────────────┐
     │  incidents table  │  (PostgreSQL + PostGIS / Haversine)
     └─────────┬─────────┘
               │ (DB Webhook on INSERT)
               ▼
   ┌───────────────────────┐
   │ Sentinel AI Agent     │  Powered by Groq LPU (Llama 3 / Fast Triage)
   │ (analyze-incident)    │  - Sub-300ms Severity Scoring (1-10)
   └───────────┬───────────┘  - 1km Radius Haversine Duplicate Deduplication
               │
               ▼ (DB UPDATE severity_score)
     ┌───────────────────┐
     │  incidents table  │
     └─────────┬─────────┘
               │ (DB Webhook on UPDATE severity_score OR status='resolved')
               ▼
   ┌───────────────────────┐
   │ Strategist AI Agent   │  Powered by Google Gemini (Optimization Engine)
   │ (allocate-resources)  │  - Combinatorial Resource Matching
   └───────────┬───────────┘  - Dynamic Re-allocation on Incident Resolution
               │              - Atomic Conditional Locking (No Double-Booking)
               ▼
     ┌───────────────────┐      ┌──────────────────┐
     │  resources table  │      │ audit_logs table │
     └───────────────────┘      └──────────────────┘
               │                         │
               └────────────┬────────────┘
                            │ (Supabase Realtime)
                            ▼
          [Live Dashboards: Authority / Rescue / Citizen]
```

---

##  Tech Stack

- **Framework**: Next.js 14 (App Router, Server Components & Route Handlers)
- **Database & Auth**: Supabase PostgreSQL 15+, Row Level Security (RLS), Supabase Auth (`@supabase/ssr`)
- **Serverless Compute**: Supabase Edge Functions (Deno runtime) for isolated AI operations
- **Fast Triage AI**: Groq API (Language Processing Unit for low-latency emergency triage)
- **Optimization AI**: Google Gemini API (Deep reasoning for spatial/resource constraint balancing)
- **Deployment**: Vercel (Next.js hosting with `vercel.json` edge routing)

---

##  Environment Variables

Copy `.env.example` to `.env.local` for local development:

```bash
cp .env.example .env.local
```

### Required Variables Reference

| Variable Name | Required By | Description | Example / Target |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Client & Server | Supabase project API URL | `https://xyzcompany.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client & Server | Public Supabase anon key for client-side Auth/Realtime | `sb_publishable_...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side only | Elevated administrative secret bypasses RLS for AI agents | `sb_secret_...` |
| `GROQ_API_KEY` | Sentinel Agent | High-speed API key for Llama 3 emergency triage | `gsk_...` |
| `GROQ_MODEL` | Sentinel Agent | Target Groq model | `openai/gpt-oss-20b` or `llama-3.3-70b-versatile` |
| `GEMINI_API_KEY` | Strategist Agent | API key for Gemini combinatorial reasoning | `AIzaSy...` |
| `GEMINI_MODEL` | Strategist Agent | Target Gemini model | `gemini-flash-latest` or `gemini-2.5-flash` |

>  **Security Notice**: Never commit `.env.local` or private keys to source control. The `SUPABASE_SERVICE_ROLE_KEY`, `GROQ_API_KEY`, and `GEMINI_API_KEY` must **never** be prefixed with `NEXT_PUBLIC_`.

---

##  Supabase Database & Edge Functions Setup

### 1. Database Schema & RLS Setup
1. Log in to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Navigate to **SQL Editor** -> **New Query**.
3. Copy and run the entire contents of [`supabase/schema.sql`](./supabase/schema.sql).
   - This sets up `profiles`, `incidents`, `resources`, `audit_logs`, spatial distance functions, and Row Level Security policies.

### 2. Setting Secrets via CLI
Supabase Edge Functions execute in a secure, isolated Deno environment. You must set their secrets using the Supabase CLI:

```bash
# 1. Login to Supabase CLI
supabase login

# 2. Link your local project to your remote Supabase instance
supabase link --project-ref <your-supabase-project-ref>

# 3. Set all required secrets for the Edge Functions
supabase secrets set \
  GROQ_API_KEY="your-actual-groq-api-key" \
  GROQ_MODEL="openai/gpt-oss-20b" \
  GEMINI_API_KEY="your-actual-gemini-api-key" \
  GEMINI_MODEL="gemini-flash-latest" \
  SUPABASE_URL="https://<your-supabase-project-ref>.supabase.co" \
  SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
```

Verify secrets are properly bound:
```bash
supabase secrets list
```

### 3. Deploying Edge Functions
Deploy the three server-side functions to your Supabase project:

```bash
# 1. Profile auto-creation trigger
supabase functions deploy create-profile --no-verify-jwt

# 2. Sentinel AI Agent (Needs Assessment & Deduplication)
supabase functions deploy analyze-incident --no-verify-jwt

# 3. Strategist AI Agent (Allocation & Dynamic Re-allocation)
supabase functions deploy allocate-resources --no-verify-jwt
```

### 4. Database Webhooks Configuration
Configure Postgres Webhooks so Edge Functions fire automatically on database events:

1. In Supabase Dashboard, go to **Database** -> **Webhooks** -> **Create a new webhook**.
2. **Webhook 1: Sentinel Agent Trigger**
   - **Name**: `on_incident_created_analyze`
   - **Table**: `public.incidents`
   - **Events**: `INSERT`
   - **Type**: `Supabase Edge Function` -> `analyze-incident`
3. **Webhook 2: Strategist Agent Trigger**
   - **Name**: `on_incident_severity_allocate`
   - **Table**: `public.incidents`
   - **Events**: `UPDATE`
   - **Type**: `Supabase Edge Function` -> `allocate-resources`

---

##  Vercel Deployment Guide

### Step-by-Step Deployment
1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "docs: backend - final config, env setup and README"
   git push origin main
   ```
2. **Import Project to Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new).
   - Select your GitHub repository (`KH-132 -NEURAL NOVA`).
   - Framework Preset: **Next.js**.
3. **Configure Environment Variables in Vercel**:
   Add the following in **Project Settings -> Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GROQ_API_KEY`
   - `GROQ_MODEL`
   - `GEMINI_API_KEY`
   - `GEMINI_MODEL`
4. **Deploy**: Click **Deploy**. Vercel will build and serve the application globally.

### `vercel.json` Settings
A [`vercel.json`](./vercel.json) file is included at the root of the project:
- Configures serverless route handler duration (`maxDuration: 30`) to accommodate AI inferences during peak emergency simulations.
- Injects standard security headers (`nosniff`, `DENY` framing, and strict CORS policies).

---

##  API Routes Reference

### 1. `GET /api/auth/session`
- **Description**: Returns the authenticated user profile, verified role (`citizen`, `rescue`, `authority`), and token state using `@supabase/ssr` cookies.
- **Security**: Never exposes user passwords or sensitive session tokens.

### 2. `POST /api/demo/simulate-disaster`
- **Description**: Injects 5 realistic catastrophe scenarios spanning Zones A through E (structural collapse, flash flood, electrical hazard, medical distress, localized gas leak) with authentic coordinates and timestamps.
- **Security**: Protected endpoint restricted to users with `authority` or `admin` roles (or demo bypass when testing locally).

### 3. `GET /api/audit-log`
- **Description**: Fetches the most recent 50 immutable audit trail records for compliance, tracking actions taken by both human operators and autonomous AI agents (`Sentinel Agent`, `Strategist Agent`).

---

##  Testing & Verification

A dedicated end-to-end backend verification script is provided in [`scripts/verify-senior-backend.mjs`](./scripts/verify-senior-backend.mjs).

Run the verification test:
```bash
node scripts/verify-senior-backend.mjs
```

This verifies:
1. Local Next.js server connectivity and route availability.
2. `/api/auth/session` endpoint integrity (safe response, cookie handling, zero password leaks).
3. `/api/demo/simulate-disaster` 5-zone incident generation with realistic coordinates.
4. `/api/audit-log` retrieval and formatting.
5. Live Supabase database tables and RLS policy compatibility.
6. Groq and Gemini API keys and model availability.
