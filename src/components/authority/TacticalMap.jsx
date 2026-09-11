import React from 'react';
import { useEmergency } from '../../context/EmergencyContext';

export default function TacticalMap() {
  const { zones, selectedZoneId, setSelectedZoneId } = useEmergency();

  // Zone coordinates for SVG map positioning
  const zoneMapData = {
    'zone-04': { x: 380, y: 260, label: 'Lower Basin', radius: 48, code: 'Z-04' },
    'zone-01': { x: 230, y: 130, label: 'North District', radius: 42, code: 'Z-01' },
    'zone-02': { x: 520, y: 290, label: 'East Industrial', radius: 36, code: 'Z-02' },
    'zone-03': { x: 160, y: 290, label: 'Highland Ridge', radius: 34, code: 'Z-03' },
    'zone-05': { x: 440, y: 390, label: 'South Harbor Pier', radius: 40, code: 'Z-05' }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return '#791F1F';
      case 'watch': return '#854F0B';
      case 'safe': return '#3B6D11';
      default: return '#3B6D11';
    }
  };

  return (
    <div className="tactical-map-container">
      <div className="tactical-map-toolbar">
        <div className="map-toolbar-left">
          <span className="map-toolbar-label">Sector telemetry</span>
          <span className="mono-num map-coords">42.3601 N, 71.0589 W</span>
        </div>
        <div className="map-toolbar-right">
          <span className="mono-num map-layer-info">Grid ref: UTM-19T</span>
          <span className="mono-num map-layer-info">Sensor array: active</span>
        </div>
      </div>

      <div className="svg-map-wrapper">
        <svg
          viewBox="0 0 700 450"
          className="tactical-svg-canvas"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Grid pattern */}
            <pattern id="tacticalGrid" width="35" height="35" patternUnits="userSpaceOnUse">
              <path d="M 35 0 L 0 0 0 35" fill="none" stroke="#1B232E" strokeWidth="0.75" />
            </pattern>
          </defs>

          {/* Tactical grid background */}
          <rect width="100%" height="100%" fill="url(#tacticalGrid)" />

          {/* Waterway / geography lines */}
          <path
            d="M 280 0 C 310 90, 360 160, 420 230 C 470 290, 490 350, 460 450"
            fill="none"
            stroke="#1B2838"
            strokeWidth="32"
            strokeLinecap="round"
          />
          <path
            d="M 280 0 C 310 90, 360 160, 420 230 C 470 290, 490 350, 460 450"
            fill="none"
            stroke="#203042"
            strokeWidth="2"
            strokeDasharray="4 4"
          />

          {/* Topographic and zone boundaries */}
          <polygon
            points="140,80 320,70 340,200 150,210"
            fill="#151B22"
            stroke="#263140"
            strokeWidth="1"
          />
          <polygon
            points="310,210 490,190 530,340 330,360"
            fill="#151B22"
            stroke="#263140"
            strokeWidth="1"
          />
          <polygon
            points="480,210 650,220 630,380 490,360"
            fill="#151B22"
            stroke="#263140"
            strokeWidth="1"
          />
          <polygon
            points="90,230 250,220 230,380 80,360"
            fill="#151B22"
            stroke="#263140"
            strokeWidth="1"
          />

          {/* Render zone nodes */}
          {zones.map((zone) => {
            const data = zoneMapData[zone.id];
            if (!data) return null;

            const isSelected = zone.id === selectedZoneId;
            const sevColor = getSeverityColor(zone.severity);

            return (
              <g
                key={zone.id}
                className={`map-zone-node ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedZoneId(zone.id)}
                style={{ cursor: 'pointer' }}
              >
                {/* Zone perimeter */}
                <circle
                  cx={data.x}
                  cy={data.y}
                  r={data.radius}
                  fill={isSelected ? '#1E2633' : '#171E27'}
                  stroke={isSelected ? '#4C5D75' : '#283444'}
                  strokeWidth={isSelected ? 1.75 : 1}
                />

                {/* Left accent strip simulation inside SVG node */}
                <path
                  d={`M ${data.x - data.radius} ${data.y - 14} L ${data.x - data.radius} ${data.y + 14}`}
                  stroke={sevColor}
                  strokeWidth="3.5"
                  strokeLinecap="square"
                />

                {/* Status Dot */}
                <circle
                  cx={data.x - 16}
                  cy={data.y - 8}
                  r="4"
                  fill={sevColor}
                />

                {/* Zone Code */}
                <text
                  x={data.x - 6}
                  y={data.y - 4}
                  fill="#F6F4EF"
                  fontFamily="'IBM Plex Mono', monospace"
                  fontSize="11"
                  fontWeight="500"
                >
                  {data.code}
                </text>

                {/* Zone Name */}
                <text
                  x={data.x}
                  y={data.y + 12}
                  textAnchor="middle"
                  fill="#8E98A5"
                  fontFamily="'IBM Plex Sans', sans-serif"
                  fontSize="10"
                >
                  {zone.name}
                </text>

                {/* Resource count indicator */}
                <text
                  x={data.x}
                  y={data.y + 26}
                  textAnchor="middle"
                  fill="#F6F4EF"
                  fontFamily="'IBM Plex Mono', monospace"
                  fontSize="9.5"
                >
                  {zone.resources} units
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="map-legend">
        <div className="legend-item">
          <span className="status-dot severity-critical"></span>
          <span>Critical priority</span>
        </div>
        <div className="legend-item">
          <span className="status-dot severity-watch"></span>
          <span>Watch status</span>
        </div>
        <div className="legend-item">
          <span className="status-dot severity-safe"></span>
          <span>Safe status</span>
        </div>
      </div>
    </div>
  );
}
