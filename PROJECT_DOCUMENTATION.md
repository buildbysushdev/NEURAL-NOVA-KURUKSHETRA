# Project Overview
Kurukshetra PS20 is an autonomous, multi-agent disaster relief and tactical coordination platform designed for State Disaster Management Authorities (SDMA), first-responder rescue teams (NDRF/SDRF), and affected citizens. It streamlines chaotic catastrophe operations by providing an offline-resilient citizen reporting and emergency assistance app, an autonomous AI triage and resource allocation engine, and real-time operational command consoles for field rescue squads and headquarters personnel.

# Problem Statement
During severe disasters such as coastal storm surges, urban flash floods, and structural collapses, emergency response systems suffer from severe communication breakdowns, duplicate distress calls, delayed triage, and manual resource allocation bottlenecks. Citizens are unable to submit verifiable SOS reports when network connectivity drops, emergency dispatchers waste critical hours answering repeated reports for the same incident, and relief supplies sit idle or are misallocated due to a lack of coordinated, real-time inventory intelligence.

# Solution Architecture
The platform operates on an event-driven, closed-loop architecture spanning report ingestion, sub-second AI triage, combinatorial resource optimization, and multi-channel notification dispatch:

```
[Citizen App / Public SOS] ──(Online / Offline Sync)──> [Next.js API & Supabase Ingestion]
                                                                  │
                                                                  ▼
                                                      [Database Table: incidents]
                                                                  │
                                                      (PostgreSQL DB Webhook)
                                                                  │
                                                                  ▼
                                                   [Sentinel Agent (Groq / Llama 3)]
                                                   - Sub-300ms Severity Triage (1-10)
                                                   - Resource Need Extraction
                                                   - 1km Haversine Duplicate Deduplication
                                                                  │
                                                                  ▼
                                                  [Strategist Agent (Google Gemini)]
                                                  - Inventory Knapsack Optimization
                                                  - Multi-Depot Proximity Matching
                                                  - Atomic SQL Locking (Prevents Double-Booking)
                                                  - Dynamic Re-Allocation on Incident Resolution
                                                                  │
                                                                  ▼
                                        [Supabase Realtime WebSockets & Broadcast Feed]
                                       ┌──────────────────────────┼──────────────────────────┐
                                       ▼                          ▼                          ▼
                              [Authority War Room]       [Rescue Squad Console]     [Citizen Status Banner]
                              - Interactive GIS Map      - Task Cards & Navigation  - Real-time Threat Alert
                              - AI Audit Log Terminal    - On/Off Duty Switch       - Multi-lingual Assistant
                              - Inventory Quota Control  - Status Updates (Resolved)
```

### Database Tables & Schema

1. **`profiles`**
   - **Purpose**: Extends Supabase Auth (`auth.users`) to store user roles, contact information, and geographic assignment.
   - **Columns**: `id` (UUID, PK referencing `auth.users`), `email` (TEXT), `role` (TEXT: `'citizen'`, `'rescue'`, `'authority'`), `phone` (TEXT), `preferred_language` (TEXT: `'en'`, `'hi'`), `location_json` (JSONB), `created_at` (TIMESTAMPTZ).
   - **Security**: Row Level Security (RLS) ensures citizens view/update their own profile, while authorities have read access across profiles.

2. **`incidents`**
   - **Purpose**: Core emergency distress feed ingested from citizens, field spotters, or simulated scenarios.
   - **Columns**: `id` (UUID, PK), `location_lat` (DOUBLE PRECISION), `location_lng` (DOUBLE PRECISION), `type` (TEXT: e.g., `'flood'`, `'fire'`, `'structural_collapse'`), `description` (TEXT), `severity_score` (INT: 0 to 10), `status` (TEXT: `'open'`, `'resolved'`), `is_duplicate` (BOOLEAN), `duplicate_of_id` (UUID, self-referencing FK), `needed_resources` (TEXT[]: e.g., `["water", "boats", "medical"]`), `language` (TEXT: `'en'`, `'hi'`), `ai_analysis_json` (JSONB: raw inference trace and reasoning), `reported_by` (UUID, FK referencing `profiles`), `created_at` (TIMESTAMPTZ).
   - **Security**: Public/authenticated INSERT permitted for emergency SOS reports; SELECT scoped to reporters, rescue personnel, and authority commanders.

3. **`resources`**
   - **Purpose**: Real-time relief supply stockpiles and equipment stationed across regional logistics depots.
   - **Columns**: `id` (UUID, PK), `type` (TEXT: `'water'`, `'food'`, `'medical'`, `'tent'`), `quantity` (INT), `location_hub` (TEXT: e.g., `'Marina Central Depot'`), `assigned_to_incident_id` (UUID, FK referencing `incidents`), `created_at` (TIMESTAMPTZ).
   - **Security**: Atomic reservations via conditional locking (`assigned_to_incident_id IS NULL`) prevent double-booking.

4. **`audit_logs`**
   - **Purpose**: Immutable, tamper-evident audit trail capturing every autonomous AI decision and Commander manual override.
   - **Columns**: `id` (UUID, PK), `agent_name` (TEXT: e.g., `'Sentinel Agent'`, `'Strategist Agent'`, `'Authority'`), `action` (TEXT), `details_json` (JSONB), `timestamp` (TIMESTAMPTZ).
   - **Security**: Append-only inserts; authority commanders can inspect the complete timeline for governance.

# Tech Stack
Based directly on [`backend/package.json`](file:///c:/sreeram/Pictures/sree%20docs/sree%20projectworks/hacktons/mit%20hackton%20sept%2011&12/KH-132%20-NEURAL%20NOVA/backend/package.json) and active backend configurations:

- **Core Languages**: TypeScript (strict mode), JavaScript (ES Modules, Node.js runtime), SQL (PostgreSQL 15+ PL/pgSQL), Deno (Supabase Edge Functions).
- **Frontend Framework**: Next.js 14.2.15 (App Router, Server & Client Components), React 18.3.1, React DOM 18.3.1.
- **Styling & Design System**: Tailwind CSS 3.4.14, PostCSS 8.4.47, Autoprefixer 10.4.20, `clsx` 2.1.1, `tailwind-merge` 2.5.4.
- **UI Primitives & Notifications**: Custom Radix-style UI primitives, `lucide-react` 0.453.0 (exclusive iconography with 1.75px stroke width), `sonner` 2.0.8 (toast notification stream).
- **Animations & Layout**: `framer-motion` 13.2.0.
- **Mapping & GIS Visualization**: Leaflet 1.9.4, `react-leaflet` 4.2.1, `@types/leaflet` 1.9.12.
- **Database, Auth & Realtime**: Supabase (PostgreSQL 15+), `@supabase/supabase-js` 2.116.0, `@supabase/ssr` 0.12.7.
- **AI Models & Inference SDKs**:
  - **Groq SDK** / Groq LPU Cloud API (`openai/gpt-oss-20b` / `llama-3.3-70b-versatile`) for sub-300ms triage and deduplication.
  - **Google Generative AI / Gemini API** (`gemini-flash-latest` / `gemini-1.5-flash`) for knapsack resource allocation.

# Features by Portal

### 1. Citizen App (`/dashboard/citizen`)
- **Persistent Active Disaster Banner**: Displays local threat alerts with severity color coding (`#791F1F` critical, `#854F0B` watch, `#3B6D11` safe); dismissible but automatically re-arms if local hazard severity escalates.
- **Hero Safety Status Card**: Real-time sector classification (e.g., Chennai Central), distance to nearest safe depot, threat level, and instant "Broadcast Emergency SOS" trigger.
- **Offline-Resilient Incident Reporting (`ReportForm`)**:
  - Browser GPS coordinate auto-detection (`navigator.geolocation`) with manual coordinate entry fallback.
  - Dropdowns for hazard category, urgency assessment, incident description, and optional photo upload with client-side preview.
  - Automatic offline detection (`navigator.onLine == false`): caches reports in `localStorage` with a "Queued for Sync" indicator and automatically syncs to Supabase upon reconnection.
- **Sentinel Assistant Chatbot**:
  - Contextual AI support in English and Hindi for finding nearby relief camps, food rations, and medical aid.
  - Chat interface featuring alternating bubble shades, a 3-dot typing indicator, hover timestamps, and smart non-yank auto-scrolling.
- **Safe Evacuation Zones Map**: Simplified Leaflet view highlighting designated relief shelters and hazard zones.

### 2. Authority Portal (`/dashboard/authority`)
- **Operational Metrics Top Row**: 4 high-contrast stat cards (Total Incidents, Resources Available, Active Rescue Teams, AI Critical Alerts) with severity left-border strips.
- **60/40 Command Desk**:
  - **60% Regional Incident Telemetry Map**: Interactive Leaflet map with custom marker styling, color-coded severity indicators, and popups displaying incident descriptions and coordinates.
  - **40% AI Agent Audit Log Terminal**: Live stream of autonomous triage and allocation events, confidence scores, and manual Commander override buttons ("Approve Allocation" / "Reject Allocation").
- **Dispatched Broadcast Feed**: Live audit feed displaying dispatched alerts with recipient sectors, timestamps, status indicators, and channel icons (`App`, `SMS`, `Call`).
- **Regional Supply Depot Inventory Table**: Live view of stock availability percentages, critical threshold warnings for low stock in red, and inline quota replenishment/dispatch controls.
- **Simulate Disaster Scenario**: Floating action button that triggers a 5-zone realistic disaster wave into the system.

### 3. Rescue Portal (`/dashboard/rescue`)
- **Tactical Responder Switch**: Prominent "On Duty" (green `#3B6D11`) / "Off Duty" (amber `#854F0B`) operational toggle.
- **Status Filter Tabs**: Filter mission queue by "All Tasks", "Open", "In Progress", and "Resolved".
- **Mission Task Cards (`TaskCard`)**:
  - 4px left-border severity strip and monospace severity score (e.g., `SEV 9/10`).
  - Required resource tags (e.g., `boats`, `medical`, `tent`).
  - GPS coordinates and 1-click "Navigate to Sector" action launching external Google Maps directions.
  - State machine actions: "Accept Field Mission" (transitions to `in_progress`) and "Mark Mission Resolved" (transitions to `resolved`, triggering dynamic resource reallocation).
- **Feedback States**: Layout-matching skeleton loaders during sync, clean empty state when no missions are pending, and error notifications with retry actions.

# AI Agents

### 1. Sentinel Agent (Needs Assessment & Duplicate Detection)
- **Role**: Ingests unstructured emergency reports, extracts critical resource requirements, computes a 1–10 severity score, and flags duplicate reports.
- **Model / API**: Groq API using LLaMA 3 (`openai/gpt-oss-20b` or `llama-3.3-70b-versatile`) with sub-300ms response times, coupled with a 1km Haversine spatial verification rule.
- **Actual Test Run Example** (from [`backend/scripts/test-sentinel-agent.mjs`](file:///c:/sreeram/Pictures/sree%20docs/sree%20projectworks/hacktons/mit%20hackton%20sept%2011&12/KH-132%20-NEURAL%20NOVA/backend/scripts/test-sentinel-agent.mjs)):
  - **Input**:
    ```json
    {
      "id": "inc-dummy-sentinel-101",
      "type": "flood",
      "location_lat": 13.0315,
      "location_lng": 80.2520,
      "description": "Water reached 6 feet in ground floor. 30 residents trapped without power or food. 3 elderly people need heart medication urgently."
    }
    ```
  - **Output**:
    ```json
    {
      "severity": 9,
      "needed_resources": ["boats", "food", "medical", "water"],
      "is_duplicate": false,
      "triage_summary": "Critical flood inundation with 30 trapped individuals and urgent cardiovascular medication requirements."
    }
    ```
  - **Duplicate Deduplication Rule**: When a subsequent report is filed within 60 meters (`13.0320, 80.2522`) within 2 hours, the agent computes distance (`0.060 km <= 1.0 km`), links `duplicate_of_id`, and marks `is_duplicate: true`.

### 2. Strategist Agent (Resource Allocation & Dynamic Reallocation)
- **Role**: Solves multi-depot knapsack allocation constraints, assigns inventory to incidents without double-booking, and dynamically frees and reassigns assets when incidents are resolved.
- **Model / API**: Google Gemini API (`gemini-flash-latest` / `gemini-1.5-flash`) for multi-depot combinatorial matching, paired with atomic PostgreSQL conditional locking (`assigned_to_incident_id IS NULL`).
- **Actual Test Run Example** (from [`backend/scripts/test-strategist-agent.mjs`](file:///c:/sreeram/Pictures/sree%20docs/sree%20projectworks/hacktons/mit%20hackton%20sept%2011&12/KH-132%20-NEURAL%20NOVA/backend/scripts/test-strategist-agent.mjs)):
  - **Input**:
    ```json
    {
      "incident": {
        "id": "inc-strat-test-202",
        "severity_score": 9,
        "needed_resources": ["water", "medical", "food"]
      },
      "available_inventory": [
        { "id": "res-water-01", "type": "water", "quantity": 5000, "location_hub": "Marina Central Hub" },
        { "id": "res-food-01", "type": "food", "quantity": 3000, "location_hub": "Marina Central Hub" },
        { "id": "res-med-01", "type": "medical", "quantity": 250, "location_hub": "North Depot" }
      ]
    }
    ```
  - **Output**:
    ```json
    [
      { "resource_id": "res-water-01", "quantity": 500 },
      { "resource_id": "res-food-01", "quantity": 300 },
      { "resource_id": "res-med-01", "quantity": 50 }
    ]
    ```
  - **Dynamic Reallocation Action**: When `inc-strat-test-202` status transitions to `resolved`, the locked resources are freed and automatically transferred to the next open emergency:
    - Audit Action: `"Strategist Agent allocated Resource res-water-01 to Incident inc-priority-open-999"` (Severity 10/10 ICU crisis).

### 3. Citizen Sentinel Assistant (Chatbot)
- **Role**: Conversational emergency assistant for citizens seeking nearby shelter coordinates, food/water distribution points, or medical guidance.
- **Model / API**: Integrated client-side multi-lingual intent responder with fallback routing to Groq Sentinel agent; supports both English and Hindi.
- **Actual Test Run Example**:
  - **Input (Citizen)**: `"Where can I find drinking water and ration packets near Marina?"`
  - **Output (Assistant)**: `"Central Logistics Hub Alpha currently holds 5,000L potable water and 3,000 ration kits. Coordinates: Marina Depot (13.0827, 80.2707). Assistance teams are ready."`

### 4. Sentinel Permission-to-Report Agent (Geographic Hazard Verification)
- **Role**: Validates citizen GPS coordinates against active incidents, live NASA FIRMS thermal hotspots, and USGS seismic feeds before unlocking report submission. Prevents out-of-zone spam during high-tempo operations; immediately routes citizens outside active zones to India's National Emergency Helpline **112**.
- **Model / API**: Spatial radius calculation + Groq LPU / Gemini semantic reasoning.
- **Actual Test Run Example**:
  - **Input (Within Hazard Zone - Chennai)**: `latitude: 13.0827, longitude: 80.2707`
  - **Output**:
    ```json
    {
      "allowed": true,
      "reason": "Active disaster telemetry verified within 0.0 km of your coordinates (flood). Emergency report channel unlocked.",
      "suggestedType": "flood",
      "fallbackNumber": "112"
    }
    ```
  - **Input (Outside Hazard Zone - Central MP)**: `latitude: 20.0000, longitude: 78.0000`
  - **Output**:
    ```json
    {
      "allowed": false,
      "reason": "No active disaster telemetry detected within 50 km of your location. To keep emergency bandwidth clear for acute crisis zones, direct digital reporting is restricted. If you are in immediate personal danger, please call National Emergency Helpline 112 directly.",
      "suggestedType": null,
      "fallbackNumber": "112"
    }
    ```

### 5. Tactical Checklist Agent (Historical Disaster RAG Engine)
- **Role**: RAG-style knowledge engine seeded with 12+ real Indian disaster case studies (Kerala 2018, Fani 2019, Chennai 2015, Bhuj 2001, Kedarnath 2013, Biparjoy 2023, etc.). Generates prioritized tactical action checklists citing real historical precedents and operational lessons learned.
- **Model / API**: RAG vector matching over historical Indian disaster records + Groq/Gemini structured military/NDMA output.
- **Actual Test Run Example**:
  - **Input**: `{ "incident_type": "flood", "severity": "critical", "location": "Marina Waterfront Sector B" }`
  - **Output Action Item #1**:
    - **Action**: "Mobilize civilian motorized fishing boats and NDRF shallow-draft inflatable rafts for residential extraction."
    - **Category**: `evacuation` | **Priority**: `1` | **Time**: `Within 3h`
    - **Historical Precedent**: *"Kerala Floods 2018: 669 civilian coastal fishing vessels extracted 65,000 marooned citizens in 48 hours from narrow lanes inaccessible to 10-ton military trucks."*
    - **Rationale**: "Standard high-clearance military trucks submerge or hydroplane above 1.5m water levels. Shallow-draft motorized craft are the only viable extraction method."

### 6. Multi-Channel Notification Dispatcher with OASIS CAP v1.2 Protocol
- **Role**: Dispatches synchronized emergency warnings across In-App Push (Supabase Realtime WebSockets), SMS priority gateways (simulated log), automated Voice IVR TTS calls (simulated log), and standard OASIS CAP v1.2 XML feeds adhering to NDMA / IMD India specifications.
- **CAP v1.2 XML Structure**: Generates valid XML with `<identifier>`, `<sender>`, `<info><category>Safety</category><urgency>Immediate</urgency><severity>Extreme</severity><area><circle>lat,lng,radius</circle></area></info>`.

# Feature Reality Check Table (Judges' Disclosure)

In alignment with professional hackathon standards and real-world disaster management ethics, this table provides complete surgical transparency regarding which components are functioning live versus which are realistically simulated:

| Feature | Status | Technical Implementation | Judge Disclosure |
| :--- | :---: | :--- | :--- |
| **Google OAuth / Credentials** | ✅ REAL | Supabase Auth with role-based profiles (`citizen`, `rescue`, `authority`) | 100% live authentication & session cookies |
| **Phone Number Capture** | ✅ REAL | Next.js form state + Supabase profile persistence | Real schema field & state management |
| **Live Geolocation Tracking** | ✅ REAL | HTML5 `navigator.geolocation` browser API with accuracy timeout | Real live client GPS telemetry |
| **Nearby Disaster Detection** | ✅ REAL | Haversine mathematical spatial proximity checking | Real client/server spatial math |
| **Fire Hotspots (NASA FIRMS)** | ✅ REAL | NASA FIRMS South Asia NRT live feed (`FIRMS_MAP_KEY`) | Real-time live NASA satellite thermal telemetry |
| **Earthquake Telemetry (USGS)** | ✅ REAL | USGS GeoJSON Realtime Seismic feed | Real-time live global USGS earthquake data |
| **Cyclone / Flood Modeling** | ⚠️ SIMULATED | IMD / CWC scenario data generators | Transparently simulated for repeatable live demo |
| **AI Permission-to-Report** | ✅ REAL | Spatial 50km verification + 112 emergency fallback | Real rule + AI logic protecting dispatch bandwidth |
| **Incident Reporting Form** | ✅ REAL | Form with GPS auto-fill and Base64 photo storage | Real client-to-server data submission |
| **AI Severity Triage (Sentinel)** | ✅ REAL | Groq LPU / LLaMA 3 sub-300ms inference | Real live LLM evaluation |
| **AI Resource Allocation (Strategist)** | ✅ REAL | Google Gemini multi-depot knapsack solver | Real live LLM optimization with SQL locks |
| **Historical Disaster Learning** | ✅ REAL | 12+ real Indian disaster case studies RAG lookup | Real dataset lookup with verified precedents |
| **AI Tactical Action Checklist** | ✅ REAL | Groq/Gemini structured military/NDMA output | Real tactical checklist generation & ratification |
| **Authority War Room Dashboard** | ✅ REAL | Next.js 14 + Command Glass design system | Production-grade responsive UI |
| **Tactical Responder Task View** | ✅ REAL | Role-gated task list with state machine (`open` ➔ `in_progress` ➔ `resolved`) | Real responder mission workflow |
| **In-App Push Notifications** | ✅ REAL | Supabase Realtime WebSockets | Real live pub/sub broadcast |
| **Outbound SMS Alerts** | ⚠️ SIMULATED | Indian telco payload (`NDMA-ALERT`) logged to DB | Carrier dispatch simulated; delivery proofs logged |
| **Automated Voice Calls (IVR)** | ⚠️ SIMULATED | Dual-language TTS voice script logged to DB | Carrier dispatch simulated; transcripts logged |
| **Emergency CAP v1.2 Broadcast** | ⚠️ SIMULATED | OASIS CAP v1.2 compliant XML generation | Standard NDMA XML generated; carrier broadcast simulated |
| **Ground Relief Citizen Chatbot** | ✅ REAL | Anti-hallucination grounded assistant | Real LLM intent grounding with strict ungrounded guard |
| **AI Decision Audit Trail** | ✅ REAL | Append-only tamper-evident log with commander ratification | Real logging with live timestamp stream |
| **Dynamic Re-Allocation** | ✅ REAL | Atomic status transition & asset recovery | Real SQL-level re-allocation on mission resolution |
| **Tactical India Map** | ✅ REAL | Leaflet GIS with custom Command Glass dark theme | Real pan/zoom map rendering 139+ live NASA hotspots |
| **Offline Report Caching** | ✅ REAL | `localStorage` queue with `navigator.onLine` reconnection auto-sync | Real browser offline resilience |

# The Last-Mile Problem (Presentation Roadmap Slide)

### Slide Script: "Why Disasters Kill Connectivity & How We Solve The Last Mile"

> *"Judges, any disaster platform that assumes 100% 5G connectivity during a Category 4 cyclone is a fantasy. In real catastrophes, cell towers lose grid power within 4 hours, fiber backhauls are severed by landslides, and citizens are left in complete blackout. Here is our engineered 4-tier Last-Mile Architecture for production deployment:"*

```
                     ┌─────────────────────────────────────────────────────────┐
                     │            THE LAST-MILE RESILIENCE PYRAMID             │
                     └─────────────────────────────────────────────────────────┘
                                                  ▲
                                                 / \
                                                /   \
                                               /     \
                                              / TIER 4\  ── SATELLITE COMMS (ISRO GSAT / Starlink)
                                             /─────────\    Authority command posts & air-operations
                                            /   TIER 3  \  ── LoRa MESH NETWORKS (868 / 433 MHz)
                                           /─────────────\    Responders coordinate offline across 15km
                                          /    TIER 2     \  ── CELL BROADCAST SERVICE (CBS)
                                         /─────────────────\    Government one-way emergency radio broadcast
                                        /      TIER 1       \  ── OFFLINE-FIRST PWA (IndexedDB + Workers)
                                       /─────────────────────\    Citizen app functions 100% offline
```

#### Tier 1: Offline-First Progressive Web App (PWA)
- **Technology**: Service Workers, Cache Storage API, and IndexedDB.
- **How It Works**: Caches the entire relief UI, safe shelter GPS coordinates, and first-aid manuals locally on the citizen's device. Incident reports filed during blackout are encrypted and stored in an offline queue that automatically flushes and syncs to Supabase the moment a momentary signal is detected.

#### Tier 2: Cell Broadcast Service (CBS) Integration
- **Technology**: 3GPP Cell Broadcast Standard (used by India's Department of Telecommunications & NDMA).
- **How It Works**: Unlike SMS which is point-to-point and crashes when networks congest, CBS is a one-to-many broadcast on a dedicated radio channel (Channel 4370). It penetrates congested towers and alerts all mobile phones within a geographic cell sector in under 10 seconds without needing cellular data or phone numbers.

#### Tier 3: LoRa Field Mesh Networking for Rescue Squads
- **Technology**: Long Range (LoRa) radio transceivers (Meshtastic / 868 MHz license-free band).
- **How It Works**: When NDRF and SDRF squads enter flood-submerged zones with no mobile towers, each squad vehicle and drone carries a $25 LoRa node. Nodes form an autonomous peer-to-peer mesh spanning 15 km, relaying GPS victim coordinates and squad mission statuses without internet.

#### Tier 4: Strategic Satellite Uplink for Command HQ
- **Technology**: ISRO GSAT-7 / GSAT-6 emergency transponders and portable Starlink/BGAN terminals.
- **How It Works**: District Emergency Operation Centers (DEOC) maintain hardened satellite backhauls ensuring the Kurukshetra Authority War Room remains in continuous live sync with the national armed forces command regardless of terrestrial infrastructure collapse.

# Setup Instructions

### 1. Prerequisites
- **Node.js**: v18.18.0 or higher (v20+ recommended).
- **npm** or **pnpm**.
- (Optional) Active Supabase project, Groq API key, and Google Gemini API key.

### 2. Clone & Install Dependencies
```bash
git clone https://github.com/buildbysushdev/NEURAL-NOVA-KURUKSHETRA.git
cd NEURAL-NOVA-KURUKSHETRA/backend
npm install
```

### 3. Configure Environment Variables
Create `.env.local` in the `backend/` directory based on `.env.example`:
```env
# Next.js Server Port & Host
PORT=3000

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI Agent API Keys
GROQ_API_KEY=gsk_your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-flash-latest

# Demo Mode (Set to true to run with full offline fallbacks)
NEXT_PUBLIC_DEMO_MODE=true
```

### 4. Run Database Migrations (If using Supabase)
Execute the SQL script in your Supabase SQL Editor:
```bash
# Script location:
backend/supabase/schema.sql
```

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Demo Access Personas
The login gate at `/login` provides 1-click pre-configured credentials:
- **Authority Commander**: `commander@kurukshetra.gov.in` (Password: `Authority@Demo2026`) ➔ Enters `/dashboard/authority`
- **Rescue Specialist**: `rescue@kurukshetra.gov.in` (Password: `Rescue@Demo2026`) ➔ Enters `/dashboard/rescue`
- **Citizen**: `citizen@kurukshetra.gov.in` (Password: `Citizen@Demo2026`) ➔ Enters `/dashboard/citizen`
