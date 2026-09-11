import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export interface EarthquakeEvent {
  id: string;
  latitude: number;
  longitude: number;
  depth_km: number;
  magnitude: number;
  place: string;
  time: number;
  time_formatted: string;
  url: string;
  title: string;
  severity_category: "CRITICAL" | "HIGH" | "WATCH" | "MINOR";
}

let cachedEarthquakes: EarthquakeEvent[] = [];
let lastFetchedAt = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function GET() {
  const now = Date.now();

  if (cachedEarthquakes.length > 0 && now - lastFetchedAt < CACHE_TTL_MS) {
    return NextResponse.json({
      success: true,
      count: cachedEarthquakes.length,
      data: cachedEarthquakes,
      cached: true,
      last_updated: new Date(lastFetchedAt).toISOString(),
      source: "USGS Earthquake Hazards Program (India Region BBox 6-37N, 68-97E)",
    });
  }

  // India BBox: lat 6 to 37, lng 68 to 97
  // We query USGS all_day first; if count < 2 we supplement with all_week to ensure demo presence
  const feeds = [
    "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson",
    "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson",
  ];

  try {
    let parsedEvents: EarthquakeEvent[] = [];

    for (const feedUrl of feeds) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      try {
        const response = await fetch(feedUrl, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const geoJson = await response.json();
          const features = geoJson.features || [];

          for (const feat of features) {
            const coords = feat.geometry?.coordinates;
            if (!coords || coords.length < 2) continue;

            const lng = coords[0];
            const lat = coords[1];
            const depth = coords[2] || 10;
            const props = feat.properties || {};
            const mag = props.mag !== null && props.mag !== undefined ? Number(props.mag) : 0;

            // Check if within India geographic bounding box & tectonic margin
            if (lat >= 6 && lat <= 37 && lng >= 68 && lng <= 97) {
              const alreadyExists = parsedEvents.some((e) => e.id === feat.id);
              if (!alreadyExists) {
                const category =
                  mag >= 5.5
                    ? "CRITICAL"
                    : mag >= 4.5
                    ? "HIGH"
                    : mag >= 3.5
                    ? "WATCH"
                    : "MINOR";

                parsedEvents.push({
                  id: feat.id || `usgs-${lat}-${lng}-${props.time}`,
                  latitude: lat,
                  longitude: lng,
                  depth_km: depth,
                  magnitude: mag,
                  place: props.place || "Indian Subcontinent Regional Epicenter",
                  time: props.time || Date.now(),
                  time_formatted: new Date(props.time || Date.now()).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  }),
                  url: props.url || "https://earthquake.usgs.gov",
                  title: props.title || `M ${mag.toFixed(1)} - India Subcontinent`,
                  severity_category: category,
                });
              }
            }
          }
        }
      } catch (innerErr) {
        clearTimeout(timeoutId);
        // Continue to next feed if one fails
      }

      if (parsedEvents.length >= 2) {
        break; // We have active regional seismic events
      }
    }

    // Sort by magnitude descending so major tremors display on top
    parsedEvents.sort((a, b) => b.magnitude - a.magnitude);

    cachedEarthquakes = parsedEvents;
    lastFetchedAt = now;

    return NextResponse.json({
      success: true,
      count: parsedEvents.length,
      data: parsedEvents,
      cached: false,
      last_updated: new Date(now).toISOString(),
      source: "USGS Earthquake Hazards Program (India Region)",
    });
  } catch (err: any) {
    console.warn("[USGS API] Non-fatal error during USGS fetch:", err.message || err);
    return NextResponse.json({
      success: true,
      count: cachedEarthquakes.length,
      data: cachedEarthquakes,
      cached: true,
      last_updated: new Date(lastFetchedAt || now).toISOString(),
      fallback: true,
    });
  }
}
