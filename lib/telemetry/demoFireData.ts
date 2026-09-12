/**
 * ==============================================================================
 * KURUKSHETRA PS20 - AGENTIC DISASTER RELIEF
 * Telemetry: demoFireData.ts
 * ==============================================================================
 * 
 * Curated tactical demo fire points with:
 * - Dynamic spread possibility calculations linked to live wind velocity
 * - Downwind flame propagation vectors (180° opposite of wind origin)
 * - AI root-cause diagnosis for each industrial / urban emergency fire
 */

export interface DemoFirePoint {
  id: string;
  name: string;
  zone: string;
  latitude: number;
  longitude: number;
  frp_mw: number; // Fire Radiative Power (MW)
  brightness_kelvin: number;
  confidence: "high" | "nominal";
  spreadProbability: number; // Percentage 0-100%
  spreadRiskLevel: "CRITICAL" | "HIGH" | "MODERATE" | "LOW";
  cause: string;
  causeCategory: "ELECTRICAL_ARC" | "CHEMICAL_SOLVENT" | "INFRASTRUCTURE_FAILURE" | "HIGH_VOLTAGE_GALE";
  advanceRateKmh: number;
  hazardPlume: string;
  recommendedSuppressant: string;
  coordinatesFormatted: string;
}

export const DEMO_FIRE_POINTS: DemoFirePoint[] = [
  {
    id: "demo-fire-sidco",
    name: "SIDCO Industrial Chemical Plaza Blaze",
    zone: "Zone C - Central Metro",
    latitude: 13.0827,
    longitude: 80.2707,
    frp_mw: 38.4,
    brightness_kelvin: 345.2,
    confidence: "high",
    spreadProbability: 88,
    spreadRiskLevel: "CRITICAL",
    cause: "Substation floodwater infiltration caused 33kV busbar dielectric oil rupture and sustained electrical arc flash ignition.",
    causeCategory: "ELECTRICAL_ARC",
    advanceRateKmh: 2.2,
    hazardPlume: "Dense sulfur dioxide (SO2) & volatile solvent vapors drifting NNW toward residential clusters.",
    recommendedSuppressant: "Class B Alcohol-Resistant AFFF Foam + Dry Chemical Powder (DCP)",
    coordinatesFormatted: "13.0827° N, 80.2707° E",
  },
  {
    id: "demo-fire-harbor",
    name: "North Harbor Petroleum Fuel Depot (Tank 4)",
    zone: "Zone A - North Harbor",
    latitude: 13.1025,
    longitude: 80.2985,
    frp_mw: 42.1,
    brightness_kelvin: 358.0,
    confidence: "high",
    spreadProbability: 79,
    spreadRiskLevel: "CRITICAL",
    cause: "Torrential storm surge breached coastal containment bund; static discharge during sea-wall breach sparked escaped hydrocarbon vapor.",
    causeCategory: "CHEMICAL_SOLVENT",
    advanceRateKmh: 1.8,
    hazardPlume: "Heavy carbon particulate & black hydrocarbon soot crossing coastal evacuation berths.",
    recommendedSuppressant: "High-expansion Foam Deluge & Water Fog Perimeter Cooling Curtain",
    coordinatesFormatted: "13.1025° N, 80.2985° E",
  },
  {
    id: "demo-fire-ennore",
    name: "Ennore Petrochemical Buffer Zone Flare",
    zone: "Zone D - Ennore Basin",
    latitude: 13.2100,
    longitude: 80.3200,
    frp_mw: 24.6,
    brightness_kelvin: 326.5,
    confidence: "nominal",
    spreadProbability: 65,
    spreadRiskLevel: "HIGH",
    cause: "Corrosive flood brine breached auxiliary generator manifold adjacent to pressurized aromatic solvent pipeline.",
    causeCategory: "INFRASTRUCTURE_FAILURE",
    advanceRateKmh: 1.4,
    hazardPlume: "Acrid chlorinated aerosol plume dispersing along coastal squall boundary.",
    recommendedSuppressant: "CO2 Inert Gas Injection & Medium Expansion Synthetic Foam",
    coordinatesFormatted: "13.2100° N, 80.3200° E",
  },
  {
    id: "demo-fire-guindy",
    name: "Guindy Substation & Transformer Yard",
    zone: "Zone E - South Corridor",
    latitude: 13.0067,
    longitude: 80.2025,
    frp_mw: 16.8,
    brightness_kelvin: 318.4,
    confidence: "nominal",
    spreadProbability: 52,
    spreadRiskLevel: "MODERATE",
    cause: "45 km/h gale gusts sheared 110kV feeder line into dry structural timber and uninsulated step-down transformer.",
    causeCategory: "HIGH_VOLTAGE_GALE",
    advanceRateKmh: 0.9,
    hazardPlume: "Electrical insulation rubber & chlorinated biphenyl smoke.",
    recommendedSuppressant: "Dry Powder Class C & Nitrogen Purge Injection",
    coordinatesFormatted: "13.0067° N, 80.2025° E",
  },
];

/**
 * Convert meteorological degrees (where wind is coming FROM) into cardinal direction.
 */
export function getWindCardinal(degrees: number): string {
  const cardinals = [
    "N",
    "NNE",
    "NE",
    "ENE",
    "E",
    "ESE",
    "SE",
    "SSE",
    "S",
    "SSW",
    "SW",
    "WSW",
    "W",
    "WNW",
    "NW",
    "NNW",
  ];
  const index = Math.round((((degrees % 360) + 360) % 360) / 22.5) % 16;
  return cardinals[index];
}

/**
 * Calculates flame & smoke spread propagation vector (downwind from origin).
 */
export function getSpreadVector(windDirection: number): {
  bearing: number;
  cardinal: string;
  label: string;
} {
  // Fire spreads downwind (opposite direction of wind origin)
  const spreadBearing = (windDirection + 180) % 360;
  const cardinal = getWindCardinal(spreadBearing);
  return {
    bearing: spreadBearing,
    cardinal,
    label: `${cardinal} (${spreadBearing.toFixed(0)}°)`,
  };
}

/**
 * Calculates dynamic fire spread probability based on wind speed and humidity.
 */
export function calculateDynamicSpreadMetrics(
  windSpeedKmh: number,
  humidity: number,
  baseProbability: number
): {
  probability: number;
  riskLevel: "CRITICAL" | "HIGH" | "MODERATE" | "LOW";
  advanceSpeedKmh: number;
} {
  // Higher wind = exponentially faster spread; higher humidity = dampening factor
  const windFactor = Math.min(1.4, Math.max(0.7, windSpeedKmh / 35));
  const humidityFactor = Math.min(1.2, Math.max(0.7, (100 - humidity * 0.4) / 60));
  
  const calculated = Math.min(96, Math.max(25, Math.round(baseProbability * windFactor * humidityFactor)));
  
  let riskLevel: "CRITICAL" | "HIGH" | "MODERATE" | "LOW" = "MODERATE";
  if (calculated >= 80) riskLevel = "CRITICAL";
  else if (calculated >= 60) riskLevel = "HIGH";
  else if (calculated >= 40) riskLevel = "MODERATE";
  else riskLevel = "LOW";

  const advanceSpeed = Number((windSpeedKmh * 0.045 + 0.3).toFixed(1));

  return {
    probability: calculated,
    riskLevel,
    advanceSpeedKmh: advanceSpeed,
  };
}
