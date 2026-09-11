import React, { createContext, useContext, useState, useEffect } from 'react';

const EmergencyContext = createContext();

const INITIAL_ZONES = [
  {
    id: "zone-04",
    name: "Lower Basin",
    severity: "critical", // 'critical' | 'watch' | 'safe'
    resources: 24,
    coordinates: "42.3601 N, 71.0589 W",
    timestamp: "13:52:10 UTC",
    summary: "Rapid levee overflow detected. Inundation depth 42 cm and rising.",
    needs: [
      "Barrier reinforcement on Sector 3 levee",
      "Evacuation of 120 residential ground floors",
      "Backup power for drainage pumping station 4"
    ],
    allocatedResources: {
      responders: 14,
      pumps: 6,
      medicalTeams: 4
    },
    recommendation: {
      id: "rec-801",
      title: "Deploy auxiliary high-capacity pumps",
      action: "Approve transfer of 4 submersible pumps and 2 amphibious vehicles from Central Depot.",
      allocatedDelta: { responders: 2, pumps: 4, medicalTeams: 0 },
      approved: false,
      rejected: false
    }
  },
  {
    id: "zone-01",
    name: "North District",
    severity: "critical",
    resources: 18,
    coordinates: "42.3812 N, 71.0422 W",
    timestamp: "13:48:42 UTC",
    summary: "Transformer fire isolated. Secondary power line collapsed across Highway 14.",
    needs: [
      "High-voltage line clearing and grounding",
      "Traffic diversion away from Route 14 North",
      "Air quality sampling near chemical warehouse"
    ],
    allocatedResources: {
      responders: 12,
      pumps: 2,
      medicalTeams: 4
    },
    recommendation: {
      id: "rec-802",
      title: "Reroute utility emergency crew",
      action: "Redirect Grid Team 2 from East Industrial to expedite Route 14 clearance.",
      allocatedDelta: { responders: 3, pumps: 0, medicalTeams: 1 },
      approved: false,
      rejected: false
    }
  },
  {
    id: "zone-02",
    name: "East Industrial",
    severity: "watch",
    resources: 9,
    coordinates: "42.3524 N, 71.0298 W",
    timestamp: "13:30:15 UTC",
    summary: "Runoff water approaching stormwater retention limit (88% capacity).",
    needs: [
      "Continuous pressure sensor monitoring",
      "Standby generator fuel check"
    ],
    allocatedResources: {
      responders: 6,
      pumps: 2,
      medicalTeams: 1
    },
    recommendation: null
  },
  {
    id: "zone-03",
    name: "Highland Ridge",
    severity: "safe",
    resources: 4,
    coordinates: "42.3789 N, 71.0891 W",
    timestamp: "13:10:00 UTC",
    summary: "All drainage channels clear. Wind gusts below advisory threshold.",
    needs: [
      "Routine 60-minute patrol verification"
    ],
    allocatedResources: {
      responders: 4,
      pumps: 0,
      medicalTeams: 0
    },
    recommendation: null
  }
];

// Severity weight for sorting
const SEVERITY_WEIGHT = {
  critical: 3,
  watch: 2,
  safe: 1
};

export function EmergencyProvider({ children }) {
  const [zones, setZones] = useState(INITIAL_ZONES);
  const [selectedZoneId, setSelectedZoneId] = useState("zone-04");
  const [lastUpdatedZoneId, setLastUpdatedZoneId] = useState(null);
  const [citizenLocation, setCitizenLocation] = useState({
    name: "Harbor Quarter, Sector 2",
    distanceToHazardKm: 2.1,
    nearestHazard: "Flood warning 2km away",
    isCriticalNearUser: false
  });
  const [citizenReports, setCitizenReports] = useState([
    {
      id: "rep-101",
      category: "Water buildup",
      location: "Pier 9 underpass",
      description: "Water level over sidewalk curb, storm drain blocked by tree limb.",
      timestamp: "13:54:02 UTC",
      status: "Dispatched"
    }
  ]);

  // Sort zones by severity (critical > watch > safe)
  const sortedZones = [...zones].sort((a, b) => {
    return SEVERITY_WEIGHT[b.severity] - SEVERITY_WEIGHT[a.severity];
  });

  const selectedZone = zones.find(z => z.id === selectedZoneId) || sortedZones[0];

  // Active zones count = non-empty zones being managed
  const activeZonesCount = zones.length;

  // Clear animation highlight after delay
  useEffect(() => {
    if (lastUpdatedZoneId) {
      const timer = setTimeout(() => {
        setLastUpdatedZoneId(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [lastUpdatedZoneId]);

  // Trigger a new alert or escalation (demonstrates the one deliberate motion requirement)
  const triggerNewAlert = () => {
    const newZoneId = "zone-05";
    const exists = zones.find(z => z.id === newZoneId);

    const now = new Date();
    const timeStr = `${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}:${String(now.getUTCSeconds()).padStart(2, '0')} UTC`;

    if (!exists) {
      // Add new critical zone: it will slide to the top because severity is critical
      const newZone = {
        id: newZoneId,
        name: "South Harbor Pier",
        severity: "critical",
        resources: 12,
        coordinates: "42.3481 N, 71.0315 W",
        timestamp: timeStr,
        summary: "High tide surge breaching perimeter seawall at Slip 4.",
        needs: [
          "Immediate deployment of rapid cofferdams",
          "Cut off shore power connections",
          "Evacuate harbor staff"
        ],
        allocatedResources: {
          responders: 8,
          pumps: 3,
          medicalTeams: 1
        },
        recommendation: {
          id: "rec-805",
          title: "Mobilize marine flood barrier unit",
          action: "Deploy pneumatic sea barrier barrier team from Station 12.",
          allocatedDelta: { responders: 4, pumps: 2, medicalTeams: 1 },
          approved: false,
          rejected: false
        }
      };

      setZones(prev => [newZone, ...prev]);
      setSelectedZoneId(newZoneId);
      setLastUpdatedZoneId(newZoneId);
    } else {
      // Toggle severity between critical and watch to re-trigger slide into sorted position
      setZones(prev => prev.map(z => {
        if (z.id === newZoneId) {
          const nextSeverity = z.severity === "critical" ? "watch" : "critical";
          return {
            ...z,
            severity: nextSeverity,
            timestamp: timeStr,
            summary: nextSeverity === "critical" 
              ? "High tide surge breaching perimeter seawall at Slip 4." 
              : "Seawall stabilized with preliminary sandbags. Monitoring water line."
          };
        }
        return z;
      }));
      setSelectedZoneId(newZoneId);
      setLastUpdatedZoneId(newZoneId);
    }
  };

  // Reset demo data
  const resetZones = () => {
    setZones(INITIAL_ZONES);
    setSelectedZoneId("zone-04");
    setLastUpdatedZoneId(null);
  };

  // Approve AI recommendation
  const approveRecommendation = (zoneId, recId) => {
    setZones(prev => prev.map(z => {
      if (z.id === zoneId && z.recommendation && z.recommendation.id === recId) {
        const delta = z.recommendation.allocatedDelta;
        return {
          ...z,
          resources: z.resources + delta.responders + delta.pumps + delta.medicalTeams,
          allocatedResources: {
            responders: z.allocatedResources.responders + delta.responders,
            pumps: z.allocatedResources.pumps + delta.pumps,
            medicalTeams: z.allocatedResources.medicalTeams + delta.medicalTeams
          },
          recommendation: {
            ...z.recommendation,
            approved: true,
            rejected: false
          }
        };
      }
      return z;
    }));
  };

  // Reject AI recommendation
  const rejectRecommendation = (zoneId, recId) => {
    setZones(prev => prev.map(z => {
      if (z.id === zoneId && z.recommendation && z.recommendation.id === recId) {
        return {
          ...z,
          recommendation: {
            ...z.recommendation,
            approved: false,
            rejected: true
          }
        };
      }
      return z;
    }));
  };

  // Citizen submission
  const submitCitizenReport = ({ category, location, description }) => {
    const now = new Date();
    const timeStr = `${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}:${String(now.getUTCSeconds()).padStart(2, '0')} UTC`;
    const newReport = {
      id: `rep-${Math.floor(100 + Math.random() * 900)}`,
      category,
      location,
      description,
      timestamp: timeStr,
      status: "Logged with dispatch"
    };

    setCitizenReports(prev => [newReport, ...prev]);

    // Also link to Lower Basin or closest zone and update resource requirement
    setZones(prev => prev.map(z => {
      if (z.id === "zone-04") {
        return {
          ...z,
          timestamp: timeStr,
          needs: [...z.needs, `Citizen report: ${category} at ${location}`]
        };
      }
      return z;
    }));
    setLastUpdatedZoneId("zone-04");
  };

  return (
    <EmergencyContext.Provider
      value={{
        zones: sortedZones,
        activeZonesCount,
        selectedZone,
        selectedZoneId,
        setSelectedZoneId,
        lastUpdatedZoneId,
        triggerNewAlert,
        resetZones,
        approveRecommendation,
        rejectRecommendation,
        citizenLocation,
        setCitizenLocation,
        citizenReports,
        submitCitizenReport
      }}
    >
      {children}
    </EmergencyContext.Provider>
  );
}

export function useEmergency() {
  return useContext(EmergencyContext);
}
