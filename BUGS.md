# Pre-Demo Sanity Sweep & Bug Audit Checklist (BUGS.md)

**Kurukshetra PS20: Agentic Disaster Relief System**  
Last Audit: September 2026 // Production Demo Readiness: **100% COMPLETE**

---

## 🚪 1. Landing & Authentication Gate
- [x] **`/` and `/login` load without errors**: 3-Portal Command Glass Landing gateway verified with instant role selection.
- [x] **3 persona buttons all clickable**: Citizen ("I Need Help"), Rescue Squad ("I'm a Responder"), Authority HQ ("I'm Coordinating").
- [x] **1-click demo credentials autofill**: Instant 1-click persona buttons on `/login` and `/` store role in localStorage and session cookies.
- [x] **Successful login redirects to correct portal**:
  - Citizen ➔ `/dashboard/citizen`
  - Rescue Squad ➔ `/dashboard/rescue`
  - Authority ➔ `/dashboard/authority`
- [x] **Wrong credentials show friendly error**: Inline alert warning instead of unhandled console errors.
- [x] **Refresh on `/login` or portals doesn't break state**: Verified with persistent localStorage and cookies.

---

## 👤 2. Citizen Emergency Portal (`/dashboard/citizen`)
- [x] **Loads with real data or graceful demo mode**: Loads with active telemetry sector and local relief stocks.
- [x] **Location permission prompt works**: `navigator.geolocation` acquires real GPS coordinates with fallback.
- [x] **AI Permission-to-Report restriction active**:
  - Inside 50km: Verified hazard badge; incident reporting authorized.
  - Outside 50km: High-visibility notice restricting report submission with direct 1-click **[Call 112 National Emergency Helpline]** button and unmapped emergency override.
- [x] **Active disaster banner renders**: Persistent warning banner with severity indicators and safe zone evacuation corridors.
- [x] **Hero safety card shows correct sector name**: "Marina Waterfront Sector B // Chennai Central".
- [x] **SOS button clicks and shows confirmation**: Broadcast Emergency SOS trigger routes high-priority distress beacon with toast feedback.
- [x] **Report form opens in page/modal**: Validated fields for Disaster Type, Urgency, Description, GPS, and Photo Upload.
- [x] **GPS auto-detect fills coordinates OR manual entry works**: Real coordinates auto-formatted to 6 decimals.
- [x] **Category dropdown has all disaster types**: Flood, Fire, Earthquake, Landslide, Cyclone, Medical Emergency, Structural Damage.
- [x] **Photo upload preview works**: File reader converts images to durable Base64 with client-side preview and remove button.
- [x] **Submit works ONLINE**: Dispatches incident to Supabase with real-time toast feedback.
- [x] **Submit works OFFLINE**: Automatically detects `navigator.onLine == false`, stores report in `localStorage` queue, and displays "Queued for Sync" banner.
- [x] **Chatbot opens and responds**: Grounded Citizen Sentinel Chatbot answers in English and Hindi without hallucinating unverified relief centers.
- [x] **Map renders with markers**: Leaflet map renders designated safe shelters (green) and danger zones (red) with dark CartoDB tiles.

---

## 🎖️ 3. Authority Master War Room (`/dashboard/authority`)
- [x] **All 4 stat cards show real numbers**:
  - Total Incidents (live dynamic count)
  - Resources Available (e.g. 8,245 units)
  - Active Rescue Squads (8 tactical units)
  - Critical AI Alerts (filtered live count)
- [x] **Map loads with CartoDB Dark Matter tiles**: Free, zero-key, high-contrast dark tiles with NO "API KEY REQUIRED" text.
- [x] **Incident markers appear with correct severity colors**:
  - Critical: Red `#EF4444` with glowing pulse
  - Warning: Amber `#F59E0B`
  - Safe: Emerald `#10B981`
- [x] **NASA FIRMS & USGS live layers**: Real-time NASA fire hotspots (139+ active) and USGS seismic tremor telemetry.
- [x] **AI Agent Audit Log streams entries**: Live timeline capturing Sentinel triage, Strategist knapsack allocation, and Commander ratifications.
- [x] **Approve button on allocation**: Atomic database update and commander override recording.
- [x] **Historical Disaster AI Checklist Panel**: Correlates incident parameters against 12+ real Indian disasters (Kerala 2018, Fani 2019, Chennai 2015, Bhuj 2001) with 1-click ratification.
- [x] **Multi-Channel Dispatcher with CAP v1.2 Protocol**: Dispatches In-App, SMS log, Voice IVR log, and live OASIS CAP v1.2 XML adhering to NDMA / IMD India standards.
- [x] **Multi-Stage Simulation Button**: Floating action button with scenario selector (Chennai Flood, Coimbatore Fire, Himachal Earthquake) and real-time 5-stage progress drawer.

---

## 🚑 4. Rescue Squad Portal (`/dashboard/rescue`)
- [x] **On/Off duty toggle works and persists**: Green `#10B981` (On Duty) / Amber `#F59E0B` (Off Duty) switch.
- [x] **Filter tabs work**: All Tasks, Open, In Progress, Resolved.
- [x] **Task cards render with severity strip**: Color-coded left border, severity score (e.g. `SEV 9/10`), and needed resources.
- [x] **"Navigate" button opens external maps**: Launches Google Maps directions with precise incident coordinates.
- [x] **"Accept Mission" changes status**: Transitions mission to `in_progress`.
- [x] **"Mark Resolved" triggers dynamic reallocation**: Transitions status to `resolved` and frees up resources for automatic reassignment.
- [x] **Skeleton loaders & empty states**: Layout-matching skeleton loaders during fetch and clean empty states when queue is clear.

---

## 📊 Summary
- **Total Checks**: 35
- **Passed**: 35 (100%)
- **Critical Blockers Remaining**: **0**
