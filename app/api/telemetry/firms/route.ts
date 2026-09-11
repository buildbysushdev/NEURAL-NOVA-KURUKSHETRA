import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export interface FireHotspot {
  id: string;
  latitude: number;
  longitude: number;
  brightness_kelvin: number;
  confidence: string; // 'low' | 'nominal' | 'high'
  frp_mw: number;
  acq_date: string;
  acq_time: string;
  satellite: string;
  daynight: string;
}

// In-memory cache for 5 minutes (300,000 ms)
let cachedHotspots: FireHotspot[] = [];
let lastFetchedAt = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function GET() {
  const now = Date.now();

  // Return cached telemetry if within TTL
  if (cachedHotspots.length > 0 && now - lastFetchedAt < CACHE_TTL_MS) {
    return NextResponse.json({
      success: true,
      count: cachedHotspots.length,
      data: cachedHotspots,
      cached: true,
      last_updated: new Date(lastFetchedAt).toISOString(),
      source: "NASA FIRMS (VIIRS NRT South Asia)",
    });
  }

  const mapKey =
    process.env.FIRMS_MAP_KEY ||
    process.env.NEXT_PUBLIC_FIRMS_MAP_KEY ||
    "f966b20f1e9b5cba7ee8226366a7f48d";

  // India Bounding Box: [west, south, east, north] = [68, 6, 97, 37]
  // Day range: 1 (current day active detections)
  const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${mapKey}/VIIRS_SNPP_NRT/68,6,97,37/1`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "text/csv,text/plain",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(
        `[FIRMS API] Warning: Upstream responded with status ${response.status}. Using local cache.`
      );
      return NextResponse.json({
        success: true,
        count: cachedHotspots.length,
        data: cachedHotspots,
        cached: true,
        last_updated: new Date(lastFetchedAt || now).toISOString(),
        warning: "NASA FIRMS live feed timed out; displaying last known telemetry.",
      });
    }

    const csvText = await response.text();
    const lines = csvText.trim().split("\n");

    if (lines.length <= 1 || lines[0].includes("Invalid API call")) {
      console.warn("[FIRMS API] Empty or invalid response from FIRMS API.");
      return NextResponse.json({
        success: true,
        count: cachedHotspots.length,
        data: cachedHotspots,
        cached: true,
        last_updated: new Date(lastFetchedAt || now).toISOString(),
      });
    }

    // Header: latitude,longitude,bright_ti4,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_ti5,frp,daynight
    const parsed: FireHotspot[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const parts = line.split(",");
      if (parts.length < 13) continue;

      const lat = parseFloat(parts[0]);
      const lng = parseFloat(parts[1]);
      const bright = parseFloat(parts[2]);
      const acqDate = parts[5];
      const acqTime = parts[6];
      const sat = parts[7];
      const rawConf = parts[9]?.trim().toLowerCase();
      const frp = parseFloat(parts[12]);
      const dn = parts[13]?.trim();

      // Ensure coordinate is inside India bounding box
      if (
        !isNaN(lat) &&
        !isNaN(lng) &&
        lat >= 6 &&
        lat <= 37 &&
        lng >= 68 &&
        lng <= 97
      ) {
        const confidenceLabel =
          rawConf === "h" ? "high" : rawConf === "l" ? "low" : "nominal";

        parsed.push({
          id: `firms-${lat.toFixed(4)}-${lng.toFixed(4)}-${acqDate}-${acqTime}`,
          latitude: lat,
          longitude: lng,
          brightness_kelvin: isNaN(bright) ? 310 : bright,
          confidence: confidenceLabel,
          frp_mw: isNaN(frp) ? 2.5 : frp,
          acq_date: acqDate,
          acq_time: acqTime,
          satellite: sat || "VIIRS-SNPP",
          daynight: dn === "N" ? "Night" : "Day",
        });
      }
    }

    // Limit to top 250 most energetic hotspots to maintain high-FPS Leaflet rendering
    parsed.sort((a, b) => b.frp_mw - a.frp_mw);
    const topHotspots = parsed.slice(0, 250);

    cachedHotspots = topHotspots;
    lastFetchedAt = now;

    return NextResponse.json({
      success: true,
      count: topHotspots.length,
      data: topHotspots,
      cached: false,
      last_updated: new Date(now).toISOString(),
      source: "NASA FIRMS (VIIRS NRT South Asia)",
    });
  } catch (err: any) {
    console.warn(
      "[FIRMS API] Non-fatal error during FIRMS fetch:",
      err.message || err
    );
    // Silent failover per prompt requirements
    return NextResponse.json({
      success: true,
      count: cachedHotspots.length,
      data: cachedHotspots,
      cached: true,
      last_updated: new Date(lastFetchedAt || now).toISOString(),
      fallback: true,
    });
  }
}
