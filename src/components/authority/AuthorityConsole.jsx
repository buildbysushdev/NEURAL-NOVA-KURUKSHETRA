import React from 'react';
import { useEmergency } from '../../context/EmergencyContext';
import TacticalMap from './TacticalMap';
import './authority.css';

export default function AuthorityConsole() {
  const {
    zones,
    activeZonesCount,
    selectedZone,
    selectedZoneId,
    setSelectedZoneId,
    lastUpdatedZoneId,
    triggerNewAlert,
    approveRecommendation,
    rejectRecommendation
  } = useEmergency();

  return (
    <div className="authority-layout">
      {/* Left Sidebar: Zone list sorted by severity */}
      <aside className="authority-sidebar">
        <div className="sidebar-header">
          <span className="sidebar-title">Monitored zones</span>
          <span className="sidebar-subtext mono-num">{zones.length} sectors</span>
        </div>

        <div className="zone-list">
          {zones.length === 0 ? (
            <div className="sidebar-empty-state">
              No zones reporting yet — waiting for first incident
            </div>
          ) : (
            zones.map((zone) => {
              const isSelected = zone.id === selectedZoneId;
              const isAlertHighlight = zone.id === lastUpdatedZoneId;

              return (
                <div
                  key={zone.id}
                  className={`zone-row severity-border-${zone.severity} ${isSelected ? 'selected' : ''} ${isAlertHighlight ? 'alert-slide-highlight' : ''}`}
                  onClick={() => setSelectedZoneId(zone.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setSelectedZoneId(zone.id);
                    }
                  }}
                >
                  <div className="zone-row-left">
                    <span className={`status-dot severity-${zone.severity}`} />
                    <span className="zone-name">{zone.name}</span>
                  </div>

                  <div className="zone-row-right">
                    <span className="mono-num zone-resource-count">{zone.resources}</span>
                    <span className="zone-resource-unit">units</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* Main Panel: Live map & Hero live number */}
      <main className="authority-main">
        <header className="main-hero-panel">
          <div className="hero-number-wrapper">
            <div className="hero-live-number">
              <span className="mono-num">{activeZonesCount}</span>
              <span className="hero-live-label">active zones</span>
            </div>
            <div className="hero-live-subtext">
              Real-time sector status across operational jurisdiction
            </div>
          </div>

          <div className="main-controls-wrapper">
            <button
              className="demo-trigger-btn"
              onClick={triggerNewAlert}
              title="Simulates incoming alert that slides into sorted priority"
            >
              Simulate inbound alert
            </button>
          </div>
        </header>

        <section className="main-map-area">
          <TacticalMap />
        </section>
      </main>

      {/* Right Panel: Selected Zone Detail */}
      <aside className="authority-detail">
        {selectedZone ? (
          <>
            <div className="detail-header">
              <div className="detail-zone-meta">
                <span className="mono-num detail-zone-id">{selectedZone.id.toUpperCase()}</span>
                <span className="mono-num detail-zone-timestamp">{selectedZone.timestamp}</span>
              </div>

              <div className="detail-zone-title-row">
                <span className={`status-dot severity-${selectedZone.severity}`} />
                <h2 className="detail-zone-title">{selectedZone.name}</h2>
              </div>

              <div className="detail-severity-badge">
                <span>Priority:</span>
                <span style={{ color: selectedZone.severity === 'critical' ? '#E08080' : selectedZone.severity === 'watch' ? '#D6A46A' : '#7BB651' }}>
                  {selectedZone.severity === 'critical' ? 'Critical response' : selectedZone.severity === 'watch' ? 'Active watch' : 'Stable'}
                </span>
              </div>

              <p className="detail-summary-text">{selectedZone.summary}</p>
            </div>

            <div className="detail-content-scroll">
              {/* Needs section */}
              <div className="detail-section">
                <span className="section-label">Reported operational needs</span>
                <ul className="needs-list">
                  {selectedZone.needs && selectedZone.needs.length > 0 ? (
                    selectedZone.needs.map((need, idx) => (
                      <li key={idx} className="needs-item">
                        <span className="needs-bullet">&bull;</span>
                        <span>{need}</span>
                      </li>
                    ))
                  ) : (
                    <li className="needs-item">No unmet operational needs reported.</li>
                  )}
                </ul>
              </div>

              {/* Allocated Resources */}
              <div className="detail-section">
                <span className="section-label">Allocated resources</span>
                <div className="resources-grid">
                  <div className="resource-card">
                    <span className="mono-num resource-value">
                      {selectedZone.allocatedResources?.responders ?? 0}
                    </span>
                    <span className="resource-name">Responders</span>
                  </div>
                  <div className="resource-card">
                    <span className="mono-num resource-value">
                      {selectedZone.allocatedResources?.pumps ?? 0}
                    </span>
                    <span className="resource-name">Pumps</span>
                  </div>
                  <div className="resource-card">
                    <span className="mono-num resource-value">
                      {selectedZone.allocatedResources?.medicalTeams ?? 0}
                    </span>
                    <span className="resource-name">Medical units</span>
                  </div>
                </div>
              </div>

              {/* AI Recommendation */}
              <div className="detail-section">
                <span className="section-label">Automated recommendation</span>
                {selectedZone.recommendation ? (
                  <div className={`ai-recommendation-card severity-border-${selectedZone.severity}`}>
                    <div className="ai-rec-header">
                      <span className="ai-rec-title">{selectedZone.recommendation.title}</span>
                      <span className="mono-num ai-rec-id">{selectedZone.recommendation.id}</span>
                    </div>

                    <p className="ai-rec-action-text">{selectedZone.recommendation.action}</p>

                    {selectedZone.recommendation.approved ? (
                      <div className="rec-status-banner">
                        Allocation approved. Resources in transit to sector.
                      </div>
                    ) : selectedZone.recommendation.rejected ? (
                      <div className="rec-status-banner">
                        Recommendation rejected. Resources kept at central depot.
                      </div>
                    ) : (
                      <div className="ai-rec-buttons">
                        <button
                          className="btn-approve"
                          onClick={() => approveRecommendation(selectedZone.id, selectedZone.recommendation.id)}
                        >
                          Approve allocation
                        </button>
                        <button
                          className="btn-reject"
                          onClick={() => rejectRecommendation(selectedZone.id, selectedZone.recommendation.id)}
                        >
                          Reject allocation
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="sidebar-empty-state" style={{ padding: '16px 8px' }}>
                    No pending recommendations for this sector
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="sidebar-empty-state">
            Select a sector to view operational details
          </div>
        )}
      </aside>
    </div>
  );
}
