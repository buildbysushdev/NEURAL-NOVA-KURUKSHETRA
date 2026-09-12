# NEURAL NOVA — KH-132
## Full System Architecture — KURUKSHETRA PS20: Agentic Disaster Relief Platform

> Team: Neural Nova | MIT Kurukshetra Hackathon 2026 | PS20
> Stack: Next.js 14, TypeScript, Supabase, Groq LLaMA 3.3 70B, Gemini 1.5 Flash, Leaflet, Web Speech API

---

## 1. System Overview

Three-portal agentic AI platform connecting Authority HQ, Rescue Field Squads, and Citizens.

| Capability | Technology |
|---|---|
| Sub-300ms triage | Groq LLaMA 3.3 70B (Sentinel Agent) |
| Impact enrichment | Google Gemini 1.5 Flash (Analyst Agent) |
| Knapsack allocation | Greedy solver (Strategist Agent) |
| Supply redirect | Stock-check engine in simulate/route.ts |
| Voice SOS + STT | Web Speech API browser-native offline |
| Offline Q&A | 10-category pre-fixed knowledge base |
| Cross-portal sync | Supabase Realtime + localStorage + DOM events |
| Truck animation | Pure SVG canvas, no external map lib |
| Audit trail | AuditLog.tsx + Supabase audit_log table |

---

## 2. All 20 API Endpoints

| Method | Route | Description |
|---|---|---|
| POST | /api/ai/triage | Sentinel Agent severity scoring |
| POST | /api/ai/reallocate | Strategist dynamic reallocation |
| POST | /api/simulate | Inject 5-zone disaster scenario |
| POST | /api/simulate-disaster | Alt simulation endpoint |
| GET | /api/incidents | List all incidents |
| POST | /api/incidents | Create incident + trigger triage |
| GET | /api/walkie | Last 15 transmissions |
| POST | /api/walkie | Store audio + transcript + GPS |
| GET | /api/missions | Rescue mission cards |
| POST | /api/missions | Create mission from incident |
| POST | /api/rescue/update | Update mission status |
| GET | /api/resources | All depot inventory |
| POST | /api/resources | Update stock + trigger redirect |
| POST | /api/chat | Groq chatbot endpoint |
| GET/POST | /api/audit | Immutable audit log |
| GET | /api/telemetry | Weather, wind, USGS data |
| GET | /api/sync | Cross-portal demo state poll |
| GET | /api/notifications | Authority alerts |
| POST | /api/mesh | Store-and-forward offline queue |

---

## 3. AI Agent Pipeline

SENTINEL AGENT — Groq LLaMA 3.3 70B
  Route: POST /api/ai/triage
  Output: severity_score (0-10), priority_tier, urgency_reason, resource_types
  Speed: under 300ms | Fallback: keyword rules

ANALYST AGENT — Google Gemini 1.5 Flash
  File: lib/agents/analyst.ts (24KB)
  Output: flood depth, AQI, spread rate, escalation%, affected population,
          economic impact INR, recommended_actions, historical_match
  Fallback: generateFallbackAnalysis() — NDMA calibrated, no API cost

STRATEGIST AGENT — Greedy Knapsack Solver
  Formula: Score = (severity x 10) + (civilians / 50) + (resource_gap x 2)
  Constraint: depot_stock >= required ELSE redirect to alternate depot
  Output: ranked allocation, supply redirect, CAP XML, dynamic reallocation

Fallback Chain:
  Online: Groq -> Gemini -> Supabase cache
  Offline: Rule-based -> NDMA fallback -> localStorage -> 10-cat keyword match

---

## 4. Supply Redirect Engine

Required: 80 units | Zone A stock: 30 units
  BLOCKED: depot exhausted
  Find alt depot with highest stock >= 80
  Emergency Warehouse B (200 units) selected
  SupplyRouteAnimation plays SVG truck
  Toast: Saves ~38 min vs fresh procurement

Algorithm:
  preferred = zones.find(z => z.id === preferredZoneId)
  if preferred.stock >= required: dispatch direct
  else: sort remaining by stock desc, pick first with stock >= required
  result: redirected=true, reason: "Zone A has only 30 units"

---

## 5. Walkie-Talkie Mesh Radio

File: components/WalkieTalkie.tsx (46KB)
STT: window.SpeechRecognition, en-IN, continuous, interimResults, max 5s
Confidence: >=85% green / 60-85% amber / <60% red
Offline: Yes — Chrome/Edge/Safari process locally

10-Category Offline LLM:
  safe/shelter/evacuate  -> Nearest shelter + BLUE beacon
  water/flood/rising     -> Flood protocol + boat ETA
  rescue/help/SOS        -> NDRF Squad Alpha + GPS
  food/drink/supplies    -> Relief camp locations
  medical/injured        -> Field medic + 108 queue
  fire/smoke/chemical    -> HAZMAT + evacuation corridor
  power/electricity/dark -> Generator truck schedule
  family/missing/child   -> Camp registration + SMS 1070
  road/blocked/route     -> Alternate route + boat
  helicopter/rooftop     -> LZ coords + air sortie

WalkieTransmission Schema:
  id, role (citizen/rescue), channel, sector
  audioUrl, durationMs, timestamp
  transcript, transcriptConfidence (0.0-1.0)
  isOffline, offlineAnswer
  location {lat, lng, locationName, building, floor, accuracyMeters, gridCode}

---

## 6. Animated Supply Route Map

File: components/authority/SupplyRouteAnimation.tsx
Canvas: Pure SVG 600x280px, 20 FPS at 50ms interval
Speed: progress += 0.004 per frame
Trail: last 80 positions as polyline
Rotation: truck faces direction of travel
Two modes:
  Supply: Depleted Depot -> Redirect Depot -> Disaster Zone
  Rescue: NDRF Base Camp -> Disaster Zone (on mission accept)

Popups: Supplies loaded -> Depot depleted Rerouting -> Picking up from Warehouse B -> Supplies delivered

---

## 7. Auto Demo Director

File: components/demo/AutoDemoPlayer.tsx (33KB)

Blue Flood — 6 Steps:
  1 Boot:     Arm 3 agents                    3.5s
  2 Simulate: Inject Marina flood cluster     5.0s
  3 Supply:   Zone A redirect + truck anim    4.0s
  4 Approve:  Human-in-loop approval          4.5s
  5 Showcase: 5-slide citizen overlay         26s
  6 Handoff:  Navigate to rescue portal       3.2s

Citizen Showcase — 5 Auto-Advancing Slides (CitizenShowcase.tsx):
  Slide 1: Offline AI Emergency Assistant    5s
  Slide 2: Mesh Walkie-Talkie PTT            5s
  Slide 3: Safe Shelter Locator              5s
  Slide 4: Live Incident Alert Map           5s
  Slide 5: Government Alerts + EAS           5s then auto-close

Demo Actor Chain:
  AutoDemoPlayer -> /rescue
  RescueDemoActor: accept mission -> route animation -> resolve -> /citizen
  CitizenDemoActor:
    1. Click data-demo=eas-trigger (opens EAS popup)
    2. Click data-demo=i-am-safe-btn (I Am Safe)
    3. Click data-demo=walkie-tab (Mesh Radio tab)
    4. Scroll to WalkieTalkie, simulate PTT press
    5. Set step=return-authority -> /authority
  AutoDemoPlayer: Closed-Loop Complete toast

---

## 8. Cross-Portal Sync (3 Layers)

Layer 1 — localStorage (same origin, any tab):
  kurukshetra_auto_demo_v1    -> DemoState JSON
  kurukshetra_latest_incident -> Incident JSON
  last_walkie_tx              -> WalkieTransmission JSON
  walkie_tx_history           -> Last 20 transmissions
  citizen_safety_status       -> SAFE / UNKNOWN / CRITICAL_SOS

Layer 2 — DOM CustomEvents (same window):
  kurukshetra-demo-updated       -> All portals
  kurukshetra:incident_reported  -> Rescue + Authority
  kurukshetra:voice_transmitted  -> Rescue SOS banner

Layer 3 — Supabase Realtime (cross-device):
  Channel kurukshetra-realtime-sync:
    scenario_simulated    -> Rescue gets TaskCards
    rescue_status_updated -> All portals
  Channel incidents-live:
    postgres INSERT       -> All dashboards

Polling fallback: every 2500ms localStorage check

---

## 9. Supabase Schema

incidents: id, type, description, location_lat, location_lng, severity,
           severity_score, status, needed_resources[], audio_url, transcript

walkie_transmissions: id, role, channel, sector, audio_url, duration_ms,
                      transcript, transcript_confidence, is_offline, lat, lng

audit_log: id BIGSERIAL, action, actor, details JSONB, created_at

resource_allocations: id, incident_id, resource_type, quantity,
                      source_depot, redirected_from, status

RLS Policies:
  citizen: INSERT only
  rescue: SELECT + UPDATE status
  authority: Full CRUD (auth.jwt()->>role = authority)

---

## 10. Performance Targets

| Metric | Target | Achieved |
|---|---|---|
| AI triage | <300ms | ~180ms Groq |
| Page load | <2s | ~1.2s Next.js SSG |
| Map render | <500ms | ~200ms Leaflet lazy |
| STT latency | Real-time | 0ms browser native |
| Route animation | 20 FPS | 20 FPS 50ms interval |
| Cross-portal sync | <5s | ~2.5s poll or instant Supabase |

---

## 11. Security

- Supabase JWT — role claim: authority / rescue / citizen
- Server-only: GROQ_API_KEY, GEMINI_API_KEY, SUPABASE_SERVICE_ROLE_KEY
- Client-safe: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY (RLS protected)
- Human-in-Loop: no dispatch without commander approval

---

## 12. Three-Portal Design

Authority HQ /dashboard/authority (8 tabs):
  TacticalIndiaMap 51KB, LiveZonePriorityPanel, SupplyRouteAnimation,
  AgentOrchestrationVisualizer, TacticalWorkflowSimulator,
  MesmerizingSimulationModal 31KB, AICopilotPanel, CAPDispatchPanel,
  EmergencyAlertsTab, AuditLogPanel, WeatherTelemetryBar

Rescue Field /dashboard/rescue (6 tabs):
  TaskCard, TerrainRoadAnalysisPanel, AITacticalMeasuresPanel,
  RescueInventoryManager, WalkieTalkie (rescue), SupplyRouteAnimation,
  AIIncidentClusterPanel, RescueAIChatbot

Citizen Safety /dashboard/citizen:
  ActiveDisasterBanner, ReportForm 42KB, WalkieTalkie (citizen),
  LocalAIMeshSOS 22KB, ShelterLocator x5, AlertMap,
  CitizenChatbot, GovernmentAlertModal (EAS + I Am Safe button)

Demo Components:
  AutoDemoPlayer 33KB, CitizenShowcase, CitizenDemoActor, RescueDemoActor

---

## 13. Environment Variables

NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
GROQ_API_KEY=gsk_...
GROQ_MODEL=groq/compound-mini
GEMINI_API_KEY=AIza...
GEMINI_MODEL=gemini-1.5-flash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_DEMO_MODE=true

---

## 14. Offline and Fallback

Tier 1 Online: Groq + Gemini APIs under 300ms
Tier 2 API Down: generateFallbackAnalysis() NDMA calibrated deterministic zero cost
Tier 3 No Internet:
  matchOfflineQA() 10-category keyword match
  Store-and-forward localStorage queue
  Auto-flush: window addEventListener online flushQueue

---

## 15. Key Design Decisions

Pure SVG truck animation: No deps, offline, frame-control for demo choreography.
Web Speech API over Whisper: Zero latency, offline, free, en-IN accent, disaster-resilient.
localStorage + DOM events: Works without WebSockets on degraded networks. Supabase RT adds multi-device.
Human-in-Loop approval: Ethical AI requirement. PS20 compliance. AI recommends, humans decide.
3 portals: Authority data-dense map, Rescue field-optimized glove-friendly, Citizen fear-state UX.

---

Team: Neural Nova | KH-132 | MIT Kurukshetra PS20 | 2026-09-12
