# Kurukshetra PS20: Backend API Contract & Data Models
> **Architecture Interface Specification for Frontend Team (Aditya)**  
> **Backend Architect**: Senior Backend & AI Systems  
> **Database**: Supabase PostgreSQL 15+ with Row Level Security (RLS)

---

## 1. Core TypeScript Interfaces

```typescript
// User Profile (public.profiles)
export type UserRole = 'citizen' | 'rescue' | 'authority';

export interface UserProfile {
  id: string; // UUID matches auth.users.id
  email: string;
  role: UserRole;
  phone: string | null;
  location_json: {
    lat: number;
    lng: number;
    address?: string;
  };
  created_at: string;
}

// Emergency Incident (public.incidents)
export type IncidentStatus = 'open' | 'resolved';

export interface AIAnalysisPayload {
  analyzed_at?: string;
  model?: string;
  severity_score?: number;
  needed_resources?: string[];
  is_duplicate?: boolean;
  duplicate_of_id?: string | null;
  rationale?: string;
}

export interface Incident {
  id: string; // UUID
  location_lat: number;
  location_lng: number;
  type: string; // 'flood' | 'fire' | 'medical' | 'collapse' | etc.
  description: string;
  severity_score: number; // 0 (unassessed) to 10 (critical)
  status: IncidentStatus; // 'open' | 'resolved'
  is_duplicate: boolean;
  duplicate_of_id: string | null; // UUID referencing master incident
  needed_resources: string[]; // e.g. ['boats', 'medical', 'water']
  ai_analysis_json: AIAnalysisPayload;
  reported_by: string | null; // UUID referencing profiles.id
  created_at: string;
}

// Relief Resource (public.resources)
export type ResourceType = 'water' | 'food' | 'medical' | 'tent';

export interface Resource {
  id: string; // UUID
  type: ResourceType;
  quantity: number;
  location_hub: string; // e.g. 'Marina Central Depot'
  assigned_to_incident_id: string | null; // UUID referencing incidents.id
  created_at: string;
}

// Immutable Audit Log (public.audit_logs)
export interface AuditLog {
  id: string; // UUID
  agent_name: string; // 'Sentinel Agent' | 'Strategist Agent' | 'Authority'
  action: string;
  details_json: Record<string, any>;
  timestamp: string;
}
```

---

## 2. API Endpoints Reference

### 1. `GET /api/auth/session`
Returns authenticated user session, profile, and emergency role.
- **Method**: `GET`
- **Headers**: Cookies managed automatically via `@supabase/ssr`
- **Response `200 OK`**:
```json
{
  "authenticated": true,
  "user": {
    "id": "670c5e12-8809-411a-8cbb-d3f37477ebba",
    "email": "commander@kurukshetra.gov.in",
    "role": "authority",
    "phone": "+91-9884012345",
    "location_json": {
      "lat": 13.0827,
      "lng": 80.2707,
      "address": "State Emergency Operations Center"
    },
    "created_at": "2026-09-11T10:00:00.000Z"
  }
}
```

### 2. `POST /api/demo/simulate-disaster`
Seeds 5 realistic disaster incidents across Zones A to E.
- **Method**: `POST`
- **Role Permission**: `authority` (or local development bypass)
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Simulated 5 disaster incidents across Chennai zones.",
  "count": 5,
  "simulated_incidents": [
    {
      "id": "018f4a12-70b1-7299-8854-1b1160a7d901",
      "zone": "Zone A - North Harbor",
      "type": "structural_collapse",
      "description": "Port warehouse roof collapsed after torrential rainfall; multiple workers trapped.",
      "severity_score": 9,
      "status": "open",
      "needed_resources": ["medical", "tent"]
    }
  ]
}
```

### 3. `GET /api/audit-log`
Fetches the last 50 immutable audit records for the war room dashboard.
- **Method**: `GET`
- **Role Permission**: `authority` or `rescue`
- **Response `200 OK`**:
```json
{
  "success": true,
  "count": 50,
  "logs": [
    {
      "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      "agent_name": "Strategist Agent",
      "action": "Strategist Agent allocated Resource res-01 to Incident inc-01",
      "details_json": {
        "event": "RESOURCE_ALLOCATION",
        "resource_type": "water",
        "quantity": 500
      },
      "timestamp": "2026-09-11T10:15:30.000Z"
    }
  ]
}
```
