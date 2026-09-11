"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

const DisasterReliefContext = createContext();

// Initial incidents
const INITIAL_INCIDENTS = [
  {
    id: "INC-9041",
    title: "Levee breach & flash inundation",
    location: "Sector 4, Lower Basin (Near Bridge 3)",
    coordinates: "12.9716° N, 77.5946° E",
    severity: "CRITICAL",
    category: "FLOOD",
    reportedBy: "Citizen (Geotagged SMS)",
    timestamp: "14:12:05 IST",
    status: "ALLOCATED",
    affectedCount: 140,
    waterLevelCm: 85,
    aiAnalysis: {
      severityScore: 9.4,
      aiVerified: true,
      confidence: 98,
      verifiedTimestamp: "14:12:06 IST",
      model: "Groq LPU + Gemini 1.5",
      threatSummary: "Flash inundation velocity 2.4 m/s. 140 ground-floor residents at immediate structural risk within 45 mins.",
      recommendedUnits: { boats: 2, medical: 1, pumps: 4 }
    },
    resourceAllocated: true,
    allocationDetails: {
      assignedTeam: "Alpha-7 Rapid Boat Team",
      unitsCommitted: "2 Rescue Inflatables, 1 Medical Squad, 4 Submersible Pumps",
      allocatedTimestamp: "14:14:15 IST",
      status: "En Route to Grid 14-B"
    }
  },
  {
    id: "INC-9038",
    title: "High-voltage transformer explosion & debris",
    location: "Route 14 North Arterial Corridor",
    coordinates: "12.9850° N, 77.6050° E",
    severity: "HIGH",
    category: "ELECTRICAL_FIRE",
    reportedBy: "Patrol Drone 03",
    timestamp: "13:58:30 IST",
    status: "ALLOCATED",
    affectedCount: 35,
    aiAnalysis: {
      severityScore: 8.5,
      aiVerified: true,
      confidence: 94,
      verifiedTimestamp: "13:58:31 IST",
      model: "Groq LPU",
      threatSummary: "High voltage line collapsed across main arterial road. Blocks critical ambulance corridor to District Hospital.",
      recommendedUnits: { cranes: 1, fireSuppression: 2 }
    },
    resourceAllocated: true,
    allocationDetails: {
      assignedTeam: "Grid Hazard Unit 4",
      unitsCommitted: "1 Heavy Crane, 2 Dry-Chemical Fire Tenders",
      allocatedTimestamp: "14:02:10 IST",
      status: "On Scene / Isolation Active"
    }
  },
  {
    id: "INC-9029",
    title: "Elderly home basement water seepage",
    location: "Shanti Care Sanctuary, Block B",
    coordinates: "12.9602° N, 77.5810° E",
    severity: "HIGH",
    category: "MEDICAL_EVAC",
    reportedBy: "Facility Administrator",
    timestamp: "13:42:15 IST",
    status: "PENDING_ALLOCATION",
    affectedCount: 28,
    aiAnalysis: {
      severityScore: 8.9,
      aiVerified: true,
      confidence: 97,
      verifiedTimestamp: "13:42:16 IST",
      model: "Gemini Deep Reasoning",
      threatSummary: "Oxygen concentrators threatened by rising water reaching electrical socket height within 30 minutes.",
      recommendedUnits: { generators: 1, pumps: 2, medical: 1 }
    },
    resourceAllocated: false,
    allocationDetails: null
  }
];

// Initial Resource Inventory
const INITIAL_RESOURCES = [
  {
    id: "DEPOT-NORTH",
    name: "Central Civil Defense Depot",
    location: "North Sector Command",
    personnelAvailable: 42,
    personnelDeployed: 68,
    rescueBoatsAvailable: 6,
    rescueBoatsDeployed: 14,
    medicalKitsAvailable: 120,
    foodWaterPackets: 1500,
    portableGenerators: 4,
    status: "OPTIMAL"
  },
  {
    id: "DEPOT-EAST",
    name: "Harbor Operations Hub",
    location: "East Pier Basin",
    personnelAvailable: 14,
    personnelDeployed: 46,
    rescueBoatsAvailable: 2,
    rescueBoatsDeployed: 18,
    medicalKitsAvailable: 35,
    foodWaterPackets: 450,
    portableGenerators: 1,
    status: "DEPLETING"
  },
  {
    id: "DEPOT-WEST",
    name: "Highland Reserve Armory",
    location: "West Ridge Base",
    personnelAvailable: 55,
    personnelDeployed: 15,
    rescueBoatsAvailable: 10,
    rescueBoatsDeployed: 2,
    medicalKitsAvailable: 300,
    foodWaterPackets: 4200,
    portableGenerators: 8,
    status: "STANDBY_SURPLUS"
  }
];

// Rich initial AI actions in Audit Log
const INITIAL_AUDIT_LOGS = [
  {
    id: "AUD-105",
    timestamp: "14:38:22 IST",
    actor: "Gemini Allocation Agent",
    action: "Agent allocated 50 tents to Zone A",
    details: "Dispatched emergency high-density family shelters from Depot West to Rivergate relief grounds.",
    hash: "0x8f2a...c419",
    type: "ALLOCATION"
  },
  {
    id: "AUD-104",
    timestamp: "14:32:10 IST",
    actor: "Groq Fast Triage Agent",
    action: "Assigned Severity: 9.4 to Sector 4 Levee Breach",
    details: "Sub-140ms threat scoring verified breach coordinates against LiDAR elevation topography.",
    hash: "0x7e1b...99a2",
    type: "TRIAGE"
  },
  {
    id: "AUD-103",
    timestamp: "14:26:05 IST",
    actor: "Gemini Dynamic Routing Agent",
    action: "Agent rerouted Boat Alpha-7 via Eastern Slipway",
    details: "Bypassed compromised Bridge 3 due to turbulent hydraulic shear. Saved 14 minutes transit time.",
    hash: "0x992d...41fc",
    type: "REROUTE"
  },
  {
    id: "AUD-102",
    timestamp: "14:18:40 IST",
    actor: "Supabase AI Edge Function",
    action: "Agent mobilized 300 rations to Relief Camp 2",
    details: "Automated replenishment triggered after sensor telemetry recorded surge of 120 displaced persons.",
    hash: "0x4b1c...aa82",
    type: "REPLENISHMENT"
  },
  {
    id: "AUD-101",
    timestamp: "14:12:15 IST",
    actor: "Authority Commander (Human Authorization)",
    action: "Confirmed Agentic Resource Package for INC-9041",
    details: "Human supervisor confirmed automated proposal. Resource Allocated status broadcasted.",
    hash: "0x3f5d...ee10",
    type: "CONFIRMATION"
  }
];

export function DisasterReliefProvider({ children }) {
  const [activeRole, setActiveRole] = useState("authority");
  const [incidents, setIncidents] = useState(INITIAL_INCIDENTS);
  const [resources, setResources] = useState(INITIAL_RESOURCES);
  const [auditLogs, setAuditLogs] = useState(INITIAL_AUDIT_LOGS);
  const [alertLevel, setAlertLevel] = useState("DEFCON-1: RED ALERT (MONSOON SURGE)");
  const [realtimeStatus, setRealtimeStatus] = useState("CONNECTED");
  const [lastRealtimeEvent, setLastRealtimeEvent] = useState(null);
  const [notification, setNotification] = useState(null);

  const notify = (msg, type = "info") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // ==============================================================================
  // SUPABASE REALTIME SUBSCRIPTION
  // ==============================================================================
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setRealtimeStatus("CONNECTED (SIMULATED ENGINE)");
      return;
    }

    setRealtimeStatus("CONNECTING");

    const channel = supabase
      .channel("realtime-incidents-channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "incidents"
        },
        (payload) => {
          setLastRealtimeEvent({
            type: payload.eventType,
            timestamp: new Date().toLocaleTimeString(),
            data: payload.new || payload.old
          });

          if (payload.eventType === "INSERT") {
            setIncidents((prev) => [payload.new, ...prev]);
            notify(`[Realtime INSERT] New incident ${payload.new.id} ingested!`, "urgent");
          } else if (payload.eventType === "UPDATE") {
            setIncidents((prev) =>
              prev.map((inc) => (inc.id === payload.new.id ? { ...inc, ...payload.new } : inc))
            );
            notify(`[Realtime UPDATE] Incident ${payload.new.id} updated!`, "success");
          } else if (payload.eventType === "DELETE") {
            setIncidents((prev) => prev.filter((inc) => inc.id !== payload.old.id));
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setRealtimeStatus("CONNECTED (LIVE SUPABASE WEBSOCKET)");
        } else if (status === "CHANNEL_ERROR") {
          setRealtimeStatus("CHANNEL_ERROR");
        } else if (status === "CLOSED") {
          setRealtimeStatus("CLOSED");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // ==============================================================================
  // SIMULATE DISASTER (Seeds 5 fake incidents with varying severity & AI actions)
  // ==============================================================================
  const simulateDisaster = () => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")} IST`;

    const seededIncidents = [
      {
        id: `INC-${Math.floor(9100 + Math.random() * 50)}`,
        title: "Overtopping of Rivergate Dam - Evacuate Zone A",
        location: "Rivergate Reservoir Basin, Sector 1",
        coordinates: "12.9811° N, 77.5899° E",
        severity: "CRITICAL",
        category: "FLOOD",
        reportedBy: "Hydraulic Sensor Array 04",
        timestamp: timeStr,
        status: "ALLOCATED",
        affectedCount: 240,
        aiAnalysis: {
          severityScore: 9.8,
          aiVerified: true,
          confidence: 99,
          verifiedTimestamp: timeStr,
          model: "Groq Fast LPU + Gemini 1.5 Pro",
          threatSummary: "Dam crest water level exceeded safety limit by 65cm. Downstream flood wave arriving in 20 minutes.",
          recommendedUnits: { boats: 4, medical: 2, tents: 50 }
        },
        resourceAllocated: true,
        allocationDetails: {
          assignedTeam: "Naval Inflatable Fleet Alpha",
          unitsCommitted: "4 Rescue Boats, 50 Relief Tents, 2 Mobile ICUs",
          allocatedTimestamp: timeStr,
          status: "En Route to Zone A"
        }
      },
      {
        id: `INC-${Math.floor(9150 + Math.random() * 50)}`,
        title: "Submerged Pediatric Hospital ICU Backup Power Failure",
        location: "St. Jude Children's Care, Basement Ward",
        coordinates: "12.9642° N, 77.6011° E",
        severity: "CRITICAL",
        category: "MEDICAL_EVAC",
        reportedBy: "Hospital Chief Medical Officer",
        timestamp: timeStr,
        status: "PENDING_ALLOCATION",
        affectedCount: 65,
        aiAnalysis: {
          severityScore: 9.4,
          aiVerified: true,
          confidence: 98,
          verifiedTimestamp: timeStr,
          model: "Groq Fast LPU",
          threatSummary: "Emergency diesel fuel tank contaminated with water. 14 ventilators on temporary battery backup.",
          recommendedUnits: { generators: 2, pumps: 3, medical: 4 }
        },
        resourceAllocated: false,
        allocationDetails: null
      },
      {
        id: `INC-${Math.floor(9200 + Math.random() * 50)}`,
        title: "Structural Fissure on Eastern Overpass Flyover",
        location: "East Bypass Highway Kilometer 14",
        coordinates: "12.9734° N, 77.6145° E",
        severity: "HIGH",
        category: "STRUCTURAL",
        reportedBy: "Civil Infrastructure Drone 09",
        timestamp: timeStr,
        status: "ALLOCATED",
        affectedCount: 180,
        aiAnalysis: {
          severityScore: 8.2,
          aiVerified: true,
          confidence: 94,
          verifiedTimestamp: timeStr,
          model: "Gemini Deep Reasoning",
          threatSummary: "Support pillar 4 exhibits 3.2cm lateral displacement under flood scour pressure. Immediate traffic halt advised.",
          recommendedUnits: { barriers: 12, trafficTeams: 2 }
        },
        resourceAllocated: true,
        allocationDetails: {
          assignedTeam: "Bridge Engineering Taskforce",
          unitsCommitted: "12 Concrete Barriers, 2 Survey Drones, Traffic Police",
          allocatedTimestamp: timeStr,
          status: "Overpass Closed / Detour Active"
        }
      },
      {
        id: `INC-${Math.floor(9250 + Math.random() * 50)}`,
        title: "Drinking Water Pipeline Silt Contamination",
        location: "Community Filter Station, Ward 12",
        coordinates: "12.9511° N, 77.5788° E",
        severity: "MODERATE",
        category: "WATER_SANITATION",
        reportedBy: "Municipal Water Board Sensor",
        timestamp: timeStr,
        status: "PENDING_ALLOCATION",
        affectedCount: 420,
        aiAnalysis: {
          severityScore: 6.5,
          aiVerified: true,
          confidence: 91,
          verifiedTimestamp: timeStr,
          model: "Groq LPU",
          threatSummary: "Turbidity reading exceeds 85 NTU. Boil-water advisory needed for 420 households.",
          recommendedUnits: { tankers: 3, purificationKits: 200 }
        },
        resourceAllocated: false,
        allocationDetails: null
      },
      {
        id: `INC-${Math.floor(9300 + Math.random() * 50)}`,
        title: "Fallen Banyan Tree Blocking Secondary Bypass",
        location: "Green Park Avenue near School Gate",
        coordinates: "12.9890° N, 77.5620° E",
        severity: "LOW",
        category: "ROAD_BLOCKED",
        reportedBy: "Citizen Portal",
        timestamp: timeStr,
        status: "PENDING_ALLOCATION",
        affectedCount: 15,
        aiAnalysis: {
          severityScore: 4.1,
          aiVerified: true,
          confidence: 89,
          verifiedTimestamp: timeStr,
          model: "Groq LPU",
          threatSummary: "Fallen branches obstructing bicycle lane and pedestrian pathway. No injuries reported.",
          recommendedUnits: { chainsawCrew: 1 }
        },
        resourceAllocated: false,
        allocationDetails: null
      }
    ];

    // Prepend new incidents
    setIncidents((prev) => [...seededIncidents, ...prev]);

    // Prepend 5 corresponding AI agent action audit logs
    const newAuditActions = [
      {
        id: `AUD-${String(auditLogs.length + 5).padStart(3, "0")}`,
        timestamp: timeStr,
        actor: "Gemini Allocation Agent",
        action: "Agent allocated 50 tents to Zone A",
        details: "Dispatched 50 emergency relief tents and 4 rescue boats to Rivergate Reservoir Basin.",
        hash: `0x${Math.random().toString(16).substring(2, 8)}...${Math.random().toString(16).substring(2, 6)}`,
        type: "ALLOCATION"
      },
      {
        id: `AUD-${String(auditLogs.length + 4).padStart(3, "0")}`,
        timestamp: timeStr,
        actor: "Groq Fast Triage Agent",
        action: "Assigned Severity: 9.8 to Rivergate Dam Overtopping",
        details: "Prioritized critical life hazard in <120ms based on LiDAR terrain flood slope.",
        hash: `0x${Math.random().toString(16).substring(2, 8)}...${Math.random().toString(16).substring(2, 6)}`,
        type: "TRIAGE"
      },
      {
        id: `AUD-${String(auditLogs.length + 3).padStart(3, "0")}`,
        timestamp: timeStr,
        actor: "Gemini Dynamic Routing Agent",
        action: "Agent diverted 8 ambulances around Eastern Overpass",
        details: "Structural sensor alert on overpass triggered automated reroute via West Ring Corridor.",
        hash: `0x${Math.random().toString(16).substring(2, 8)}...${Math.random().toString(16).substring(2, 6)}`,
        type: "REROUTE"
      },
      {
        id: `AUD-${String(auditLogs.length + 2).padStart(3, "0")}`,
        timestamp: timeStr,
        actor: "Supabase AI Edge Function",
        action: "Agent reserved 2 backup generators for Pediatric ICU",
        details: "Emergency battery depletion timer synchronized. Auto-reserved equipment at Depot North.",
        hash: `0x${Math.random().toString(16).substring(2, 8)}...${Math.random().toString(16).substring(2, 6)}`,
        type: "RESERVATION"
      },
      {
        id: `AUD-${String(auditLogs.length + 1).padStart(3, "0")}`,
        timestamp: timeStr,
        actor: "Disaster Simulation Engine",
        action: "Simulated 5 Multi-Severity Incidents across Sectors",
        details: "Demo workload generated: 2 Critical, 1 High, 1 Moderate, 1 Low incidents seeded.",
        hash: `0x${Math.random().toString(16).substring(2, 8)}...${Math.random().toString(16).substring(2, 6)}`,
        type: "SIMULATION"
      }
    ];

    setAuditLogs((prev) => [...newAuditActions, ...prev]);

    notify("Disaster Simulation Active: 5 multi-severity incidents seeded with AI audit actions!", "urgent");
  };

  // Simulate an incoming AI Edge Function update via Realtime
  const simulateAiEdgeFunctionUpdate = () => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")} IST`;

    const targetIncident = incidents.find((i) => !i.resourceAllocated) || incidents[0];
    if (!targetIncident) return;

    const updatedIncident = {
      ...targetIncident,
      severity: "CRITICAL",
      aiAnalysis: {
        severityScore: 9.8,
        aiVerified: true,
        confidence: 99,
        verifiedTimestamp: timeStr,
        model: "Groq LPU Edge Function v2.4",
        threatSummary: "URGENT: Hydrographic flood sensor breached 110cm threshold. Immediate power cut required.",
        recommendedUnits: { generators: 2, pumps: 4, medical: 2 }
      },
      resourceAllocated: true,
      allocationDetails: {
        assignedTeam: "Delta Water Rescue Unit + Red Cross Medics",
        unitsCommitted: "4 Submersible Pumps, 2 Generators, 2 Ambulances",
        allocatedTimestamp: timeStr,
        status: "Dispatched via Edge Function Automation"
      }
    };

    setIncidents((prev) =>
      prev.map((inc) => (inc.id === targetIncident.id ? updatedIncident : inc))
    );

    const auditEntry = {
      id: `AUD-${String(auditLogs.length + 1).padStart(3, "0")}`,
      timestamp: timeStr,
      actor: "Supabase AI Edge Function",
      action: `Agent allocated 4 pumps and 2 generators to ${targetIncident.id}`,
      details: `Edge Function updated ${targetIncident.id}: Severity upgraded to 9.8, marked 'AI Verified' and 'Resource Allocated'.`,
      hash: `0x${Math.random().toString(16).substring(2, 8)}...${Math.random().toString(16).substring(2, 6)}`,
      type: "ALLOCATION"
    };
    setAuditLogs((prev) => [auditEntry, ...prev]);

    setLastRealtimeEvent({
      type: "UPDATE (AI_EDGE_FUNCTION)",
      timestamp: timeStr,
      incidentId: targetIncident.id
    });

    notify(`Supabase Realtime: AI Edge Function allocated resources to ${targetIncident.id}!`, "urgent");
  };

  // Feature 1: Add new incident from Citizen or Rescue
  const reportIncident = (incidentData) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")} IST`;
    const newId = `INC-${Math.floor(9050 + Math.random() * 500)}`;

    const severityScore = incidentData.severity === "CRITICAL" ? 9.2 : incidentData.severity === "HIGH" ? 8.1 : 6.4;

    const newInc = {
      id: newId,
      ...incidentData,
      timestamp: timeStr,
      status: "PENDING_ALLOCATION",
      aiAnalysis: {
        severityScore,
        aiVerified: true,
        confidence: 96,
        verifiedTimestamp: timeStr,
        model: "Groq Fast LPU + Gemini 1.5",
        threatSummary: `${incidentData.category} incident in ${incidentData.location}. Automated edge assessment completed.`,
        recommendedUnits: { boats: 1, medical: 1, personnel: 6 }
      },
      resourceAllocated: false,
      allocationDetails: null
    };

    setIncidents((prev) => [newInc, ...prev]);

    const newAudit = {
      id: `AUD-${String(auditLogs.length + 1).padStart(3, "0")}`,
      timestamp: timeStr,
      actor: `${activeRole.toUpperCase()} (Report Agent)`,
      action: `AI scored ${newId} with Severity: ${severityScore}`,
      details: `Registered ${newId}: ${incidentData.title}. AI assigned Severity: ${severityScore}/10 (AI Verified).`,
      hash: `0x${Math.random().toString(16).substring(2, 8)}...${Math.random().toString(16).substring(2, 6)}`,
      type: "TRIAGE"
    };
    setAuditLogs((prev) => [newAudit, ...prev]);

    notify(`Incident ${newId} logged with AI Severity ${severityScore} (AI Verified).`, "urgent");
  };

  // Feature 3: Approve allocation
  const approveAllocation = (incidentId) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")} IST`;

    setIncidents((prev) =>
      prev.map((inc) => {
        if (inc.id === incidentId) {
          return {
            ...inc,
            status: "ALLOCATED",
            resourceAllocated: true,
            allocationDetails: {
              assignedTeam: "Rapid Deployment Taskforce",
              unitsCommitted: "2 Boats, 1 Field Trauma Unit, 4 Responders",
              allocatedTimestamp: timeStr,
              status: "Dispatched via Authority Commander"
            }
          };
        }
        return inc;
      })
    );

    const newAudit = {
      id: `AUD-${String(auditLogs.length + 1).padStart(3, "0")}`,
      timestamp: timeStr,
      actor: "Authority Commander",
      action: `Agent allocated 2 boats and 1 trauma unit to ${incidentId}`,
      details: `Commander authorized resource package for ${incidentId}. Indicator updated to 'Resource Allocated'.`,
      hash: `0x${Math.random().toString(16).substring(2, 8)}...${Math.random().toString(16).substring(2, 6)}`,
      type: "ALLOCATION"
    };
    setAuditLogs((prev) => [newAudit, ...prev]);

    notify(`Resource allocation confirmed for ${incidentId}. Visual indicator updated.`, "success");
  };

  return (
    <DisasterReliefContext.Provider
      value={{
        activeRole,
        setActiveRole,
        incidents,
        resources,
        auditLogs,
        alertLevel,
        notification,
        realtimeStatus,
        lastRealtimeEvent,
        simulateDisaster,
        simulateAiEdgeFunctionUpdate,
        reportIncident,
        approveAllocation,
        notify
      }}
    >
      {children}
    </DisasterReliefContext.Provider>
  );
}

export function useDisasterRelief() {
  return useContext(DisasterReliefContext);
}
