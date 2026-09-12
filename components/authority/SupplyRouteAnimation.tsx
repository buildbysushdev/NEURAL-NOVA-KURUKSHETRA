"use client";

/**
 * SupplyRouteAnimation.tsx
 * ========================
 * SVG-canvas animated truck routing map.
 * Shows: Depot → (optionally) Redirect Depot → Disaster Zone
 * Popup notifications: "Supplies loaded", "Depot depleted! Rerouting...", "Supplies delivered"
 *
 * Pure SVG — no external map library dependency needed.
 * Coordinates are mapped to an SVG viewport showing Tamil Nadu / Chennai area.
 */

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Package, Truck, AlertTriangle, CheckCircle2, ArrowRightLeft, MapPin } from "lucide-react";

// ── Map Layout ────────────────────────────────────────────────────────────────
// SVG viewport: 600×380  (represents ~Chennai area)
// Real coords mapped to SVG:
//   lat 12.95–13.15 → y 20–360
//   lng 80.18–80.32 → x 30–570

function latLngToSvg(lat: number, lng: number): [number, number] {
  const minLat = 12.95, maxLat = 13.18;
  const minLng = 80.17, maxLng = 80.33;
  const x = ((lng - minLng) / (maxLng - minLng)) * 540 + 30;
  const y = ((maxLat - lat) / (maxLat - minLat)) * 340 + 20;
  return [Math.round(x), Math.round(y)];
}

export interface RoutePoint {
  label: string;
  lat: number;
  lng: number;
  type: "depot" | "disaster" | "redirect";
  color: string;
  stockLevel?: number; // 0-100%
}

interface RouteSegment {
  from: RoutePoint;
  to: RoutePoint;
  isRedirect?: boolean;
}

interface Popup {
  x: number;
  y: number;
  text: string;
  icon: "load" | "depleted" | "redirect" | "delivered";
  visible: boolean;
}

interface TruckState {
  x: number;
  y: number;
  angle: number;
  progress: number; // 0-1 along current segment
  segmentIndex: number;
  done: boolean;
}

// ── Default scenario points ───────────────────────────────────────────────────
const DEFAULT_SCENARIO: {
  segments: RouteSegment[];
  label: string;
} = {
  label: "Blue Flood — Supply Reroute",
  segments: [
    {
      from: { label: "Marina North Depot", lat: 13.055, lng: 80.282, type: "depot", color: "#f59e0b", stockLevel: 20 },
      to: { label: "Emergency Warehouse B", lat: 13.082, lng: 80.271, type: "redirect", color: "#10b981", stockLevel: 90 },
      isRedirect: true,
    },
    {
      from: { label: "Emergency Warehouse B", lat: 13.082, lng: 80.271, type: "redirect", color: "#10b981", stockLevel: 90 },
      to: { label: "Zone A — North Harbor", lat: 13.103, lng: 80.299, type: "disaster", color: "#ef4444", stockLevel: 0 },
      isRedirect: false,
    },
  ],
};

const RESCUE_SCENARIO: {
  segments: RouteSegment[];
  label: string;
} = {
  label: "Rescue Team — Field Deployment",
  segments: [
    {
      from: { label: "NDRF Base Camp", lat: 12.972, lng: 80.225, type: "depot", color: "#f59e0b", stockLevel: 100 },
      to: { label: "Zone B — Marina Waterfront", lat: 13.054, lng: 80.282, type: "disaster", color: "#ef4444", stockLevel: 0 },
      isRedirect: false,
    },
  ],
};

// ── Animation speed ───────────────────────────────────────────────────────────
const TRUCK_SPEED = 0.004; // progress per frame
const FRAME_INTERVAL = 50; // ms per frame (20fps)

// ── Component ─────────────────────────────────────────────────────────────────
interface Props {
  scenario?: "blue-flood" | "red-inferno" | "rescue";
  autoPlay?: boolean;
  showRescueRoute?: boolean;
  onComplete?: () => void;
  compact?: boolean;
}

export function SupplyRouteAnimation({ scenario = "blue-flood", autoPlay = false, showRescueRoute = false, onComplete, compact = false }: Props) {
  const routeData = showRescueRoute ? RESCUE_SCENARIO : DEFAULT_SCENARIO;
  const segments = routeData.segments;

  const [truck, setTruck] = useState<TruckState>({
    x: 0, y: 0, angle: 0, progress: 0, segmentIndex: 0, done: false,
  });
  const [popup, setPopup] = useState<Popup | null>(null);
  const [trailPoints, setTrailPoints] = useState<[number, number][]>([]);
  const [playing, setPlaying] = useState(false);
  const [segmentDone, setSegmentDone] = useState<boolean[]>([]);
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const truckRef = useRef(truck);
  truckRef.current = truck;

  const svgPoints = segments.flatMap((s) => [
    latLngToSvg(s.from.lat, s.from.lng),
    latLngToSvg(s.to.lat, s.to.lng),
  ]);

  const showPopup = useCallback((x: number, y: number, text: string, icon: Popup["icon"], durationMs = 3000) => {
    setPopup({ x, y, text, icon, visible: true });
    setTimeout(() => setPopup(null), durationMs);
  }, []);

  const reset = useCallback(() => {
    if (animRef.current) clearInterval(animRef.current);
    const [sx, sy] = latLngToSvg(segments[0].from.lat, segments[0].from.lng);
    setTruck({ x: sx, y: sy, angle: 0, progress: 0, segmentIndex: 0, done: false });
    setTrailPoints([]);
    setPopup(null);
    setSegmentDone([]);
    setPlaying(false);
  }, [segments]);

  const startAnimation = useCallback(() => {
    if (playing) return;
    reset();
    setPlaying(true);

    const [sx, sy] = latLngToSvg(segments[0].from.lat, segments[0].from.lng);
    // Show initial load popup
    setTimeout(() => showPopup(sx, sy, "📦 Supplies loaded", "load", 2500), 300);

    // If first segment is redirect, show depleted popup on source depot
    if (segments[0].isRedirect) {
      setTimeout(() => {
        const [dx, dy] = latLngToSvg(segments[0].from.lat, segments[0].from.lng);
        showPopup(dx, dy, `⚠️ ${segments[0].from.label} depleted! Rerouting...`, "depleted", 3500);
      }, 2000);
    }

    let currentProgress = 0;
    let currentSegmentIdx = 0;
    let trailAccum: [number, number][] = [[sx, sy]];

    animRef.current = setInterval(() => {
      if (currentSegmentIdx >= segments.length) {
        if (animRef.current) clearInterval(animRef.current);
        setPlaying(false);
        onComplete?.();
        return;
      }

      const seg = segments[currentSegmentIdx];
      const [fromX, fromY] = latLngToSvg(seg.from.lat, seg.from.lng);
      const [toX, toY] = latLngToSvg(seg.to.lat, seg.to.lng);

      currentProgress = Math.min(1, currentProgress + TRUCK_SPEED);
      const nx = fromX + (toX - fromX) * currentProgress;
      const ny = fromY + (toY - fromY) * currentProgress;
      const angle = Math.atan2(toY - fromY, toX - fromX) * (180 / Math.PI);

      trailAccum = [...trailAccum, [nx, ny] as [number, number]].slice(-80); // keep last 80 trail points
      setTrailPoints([...trailAccum]);
      setTruck({ x: nx, y: ny, angle, progress: currentProgress, segmentIndex: currentSegmentIdx, done: false });

      if (currentProgress >= 1) {
        // Arrived at segment end
        setSegmentDone((prev) => {
          const next = [...prev];
          next[currentSegmentIdx] = true;
          return next;
        });

        if (currentSegmentIdx < segments.length - 1) {
          // Moving to redirect depot
          const nextSeg = segments[currentSegmentIdx + 1];
          const [rx, ry] = latLngToSvg(nextSeg.from.lat, nextSeg.from.lng);
          showPopup(rx, ry, `↪️ Picking up from ${nextSeg.from.label}`, "redirect", 2800);
        } else {
          // Final destination reached
          const [tx, ty] = latLngToSvg(seg.to.lat, seg.to.lng);
          showPopup(tx, ty, `✅ Supplies delivered to ${seg.to.label}!`, "delivered", 4000);
          setTruck((prev) => ({ ...prev, done: true }));
          if (animRef.current) clearInterval(animRef.current);
          setPlaying(false);
          onComplete?.();
          return;
        }

        currentSegmentIdx++;
        currentProgress = 0;
      }
    }, FRAME_INTERVAL);
  }, [playing, reset, segments, showPopup, onComplete]);

  useEffect(() => {
    if (autoPlay) {
      setTimeout(startAnimation, 600);
    }
    return () => {
      if (animRef.current) clearInterval(animRef.current);
    };
  }, [autoPlay]);

  // ── Compute all node positions ────────────────────────────────────────────
  const allNodes = [
    segments[0].from,
    ...segments.map((s) => s.to),
  ];

  // Distance label for rescue scenario
  const distanceKm = showRescueRoute
    ? Math.sqrt(
        Math.pow((segments[0].to.lat - segments[0].from.lat) * 111, 2) +
        Math.pow((segments[0].to.lng - segments[0].from.lng) * 85, 2)
      ).toFixed(1)
    : null;

  const svgH = compact ? 200 : 280;

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#080C14] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300">
            <Truck className="w-3.5 h-3.5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-100">
              {showRescueRoute ? "🚁 Rescue Team Deployment Route" : "🚚 Live Supply Route Animation"}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {showRescueRoute
                ? `NDRF Base → Disaster Zone · Distance: ${distanceKm} km`
                : "Real-time depot → disaster routing with AI redirect"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {distanceKm && (
            <span className="px-2 py-0.5 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-300 text-[10px] font-bold font-mono">
              {distanceKm} km
            </span>
          )}
          {!playing && !truck.done && (
            <button
              onClick={startAnimation}
              className="px-3 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white text-[10px] font-bold shadow-md shadow-amber-500/20 transition active:scale-95"
            >
              ▶ Animate
            </button>
          )}
          {(playing || truck.done) && (
            <button
              onClick={reset}
              className="px-3 py-1 rounded-lg bg-white/[0.06] border border-white/[0.08] text-slate-400 hover:text-white text-[10px] font-bold transition"
            >
              ↺ Reset
            </button>
          )}
        </div>
      </div>

      {/* SVG Map Canvas */}
      <div className="relative">
        <svg
          viewBox={`0 0 600 ${svgH}`}
          className="w-full"
          style={{ height: svgH }}
        >
          {/* Background grid */}
          <defs>
            <pattern id="grid-pattern" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
            </pattern>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <rect width="600" height={svgH} fill="url(#grid-pattern)" />

          {/* Route lines (dashed path between all nodes) */}
          {segments.map((seg, i) => {
            const [fx, fy] = latLngToSvg(seg.from.lat, seg.from.lng);
            const [tx, ty] = latLngToSvg(seg.to.lat, seg.to.lng);
            const isDone = segmentDone[i];
            return (
              <g key={i}>
                {/* Background dashed route */}
                <line
                  x1={fx} y1={fy} x2={tx} y2={ty}
                  stroke={seg.isRedirect ? "#f59e0b" : "#3b82f6"}
                  strokeWidth="2"
                  strokeDasharray="8 5"
                  opacity="0.25"
                />
                {/* Completed route overlay */}
                {isDone && (
                  <line
                    x1={fx} y1={fy} x2={tx} y2={ty}
                    stroke={seg.isRedirect ? "#f59e0b" : "#10b981"}
                    strokeWidth="2.5"
                    opacity="0.6"
                  />
                )}
                {/* Route label */}
                <text
                  x={(fx + tx) / 2}
                  y={(fy + ty) / 2 - 8}
                  textAnchor="middle"
                  fill={seg.isRedirect ? "#f59e0b" : "#60a5fa"}
                  fontSize="9"
                  fontFamily="monospace"
                  opacity="0.7"
                >
                  {seg.isRedirect ? "⚠️ REROUTED" : "📦 DISPATCH"}
                </text>
              </g>
            );
          })}

          {/* Truck trail */}
          {trailPoints.length > 1 && (
            <polyline
              points={trailPoints.map(([x, y]) => `${x},${y}`).join(" ")}
              fill="none"
              stroke="#a78bfa"
              strokeWidth="2.5"
              opacity="0.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Depot / Disaster Nodes */}
          {allNodes.map((node, i) => {
            const [nx, ny] = latLngToSvg(node.lat, node.lng);
            const isDepot = node.type === "depot" || node.type === "redirect";
            const isDepleted = node.type === "depot" && (node.stockLevel ?? 100) < 50;
            return (
              <g key={i} filter="url(#glow)">
                {/* Pulse ring */}
                {node.type === "disaster" && (
                  <circle cx={nx} cy={ny} r="18" fill="none" stroke="#ef4444" strokeWidth="1.5" opacity="0.3">
                    <animate attributeName="r" values="14;22;14" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2s" repeatCount="indefinite" />
                  </circle>
                )}
                {/* Node circle */}
                <circle
                  cx={nx} cy={ny} r="10"
                  fill={isDepleted ? "#7f1d1d" : node.color}
                  opacity="0.9"
                  stroke={isDepleted ? "#ef4444" : "white"}
                  strokeWidth="1.5"
                />
                {/* Icon */}
                <text x={nx} y={ny + 4} textAnchor="middle" fontSize="10" fill="white">
                  {node.type === "disaster" ? "🚨" : isDepleted ? "❌" : "🏭"}
                </text>
                {/* Stock bar (for depots) */}
                {isDepot && (
                  <g>
                    <rect x={nx - 14} y={ny + 13} width="28" height="4" rx="2" fill="rgba(0,0,0,0.5)" />
                    <rect
                      x={nx - 14} y={ny + 13}
                      width={28 * (node.stockLevel ?? 80) / 100}
                      height="4" rx="2"
                      fill={isDepleted ? "#ef4444" : "#10b981"}
                    />
                  </g>
                )}
                {/* Label */}
                <text
                  x={nx} y={ny + (isDepot ? 26 : 24)}
                  textAnchor="middle"
                  fontSize="8"
                  fontFamily="monospace"
                  fill="rgba(255,255,255,0.8)"
                  style={{ textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}
                >
                  {node.label.length > 18 ? node.label.substring(0, 16) + "…" : node.label}
                </text>
              </g>
            );
          })}

          {/* Truck icon */}
          {playing || truck.done ? (
            <g transform={`translate(${truck.x},${truck.y}) rotate(${truck.angle})`}>
              {/* Truck body */}
              <rect x="-14" y="-8" width="28" height="16" rx="3" fill="#6d28d9" stroke="#a78bfa" strokeWidth="1.5" />
              {/* Cab */}
              <rect x="-14" y="-8" width="10" height="16" rx="2" fill="#7c3aed" />
              {/* Wheels */}
              <circle cx="-8" cy="8" r="4" fill="#1e293b" stroke="#64748b" strokeWidth="1" />
              <circle cx="8" cy="8" r="4" fill="#1e293b" stroke="#64748b" strokeWidth="1" />
              {/* Arrow */}
              <text x="0" y="5" textAnchor="middle" fontSize="10" fill="white">🚛</text>
            </g>
          ) : null}

          {/* Popup */}
          {popup && popup.visible && (
            <g className="animate-in fade-in duration-300">
              <rect
                x={Math.min(Math.max(popup.x - 75, 5), 525)}
                y={Math.max(popup.y - 52, 5)}
                width="150" height="40"
                rx="8"
                fill={
                  popup.icon === "depleted" ? "#7f1d1d" :
                  popup.icon === "redirect" ? "#78350f" :
                  popup.icon === "delivered" ? "#064e3b" :
                  "#1e1b4b"
                }
                stroke={
                  popup.icon === "depleted" ? "#ef4444" :
                  popup.icon === "redirect" ? "#f59e0b" :
                  popup.icon === "delivered" ? "#10b981" :
                  "#7c3aed"
                }
                strokeWidth="1.5"
                opacity="0.95"
              />
              <text
                x={Math.min(Math.max(popup.x, 80), 520)}
                y={Math.max(popup.y - 37, 20)}
                textAnchor="middle"
                fontSize="9"
                fontFamily="system-ui, sans-serif"
                fontWeight="bold"
                fill="white"
              >
                {popup.text.length > 26 ? popup.text.substring(0, 24) + "…" : popup.text}
              </text>
              <text
                x={Math.min(Math.max(popup.x, 80), 520)}
                y={Math.max(popup.y - 22, 35)}
                textAnchor="middle"
                fontSize="8"
                fontFamily="monospace"
                fill="rgba(255,255,255,0.6)"
              >
                {popup.icon === "depleted" ? "AI rerouting..." :
                 popup.icon === "redirect" ? "Alternative depot ✓" :
                 popup.icon === "delivered" ? "Mission success!" :
                 "Truck en route"}
              </text>
            </g>
          )}
        </svg>

        {/* Legend */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-white/[0.04] bg-black/20">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
            Depot / Redirect
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
            Disaster Zone
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
            <span className="w-8 h-0.5 bg-violet-400 inline-block" style={{ borderTop: "2px dashed" }} />
            Truck Trail
          </div>
          {!showRescueRoute && (
            <div className="ml-auto flex items-center gap-1.5 text-[10px] text-amber-300 font-mono">
              <ArrowRightLeft className="w-3 h-3" />
              AI Supply Redirect Active
            </div>
          )}
          {showRescueRoute && distanceKm && (
            <div className="ml-auto flex items-center gap-1.5 text-[10px] text-blue-300 font-mono">
              <MapPin className="w-3 h-3" />
              {distanceKm} km to disaster zone
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
