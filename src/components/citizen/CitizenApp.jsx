import React, { useState } from 'react';
import { useEmergency } from '../../context/EmergencyContext';
import './citizen.css';

const PRESET_LOCATIONS = [
  {
    name: "Harbor Quarter, Sector 2",
    distance: "2km away",
    statusHeadline: "Flood warning 2km away",
    statusDescription: "Municipal storm barriers deployed along the lower river corridor. No immediate impact on your residential block. Normal utility services operational.",
    severity: "watch"
  },
  {
    name: "Highland Heights",
    distance: "8km away",
    statusHeadline: "No active alerts near you",
    statusDescription: "All local infrastructure and emergency networks reporting stable conditions across your immediate area.",
    severity: "safe"
  },
  {
    name: "Lower Basin, Rivergate St",
    distance: "150m away",
    statusHeadline: "Critical flood evacuation notice",
    statusDescription: "River surge has crested the sector levee. Evacuation order in effect for all ground floor units on Rivergate Street.",
    severity: "critical"
  }
];

export default function CitizenApp() {
  const { citizenReports, submitCitizenReport } = useEmergency();

  const [activeLocationIndex, setActiveLocationIndex] = useState(0);
  const [showLocationSelect, setShowLocationSelect] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Report Form State
  const [reportCategory, setReportCategory] = useState("Water accumulation");
  const [reportStreet, setReportStreet] = useState("");
  const [reportDetail, setReportDetail] = useState("");
  const [reportFeedback, setReportFeedback] = useState("");
  const [reportError, setReportError] = useState("");

  // Chat State
  const [chatMessages, setChatMessages] = useState([
    {
      sender: "assistant",
      text: "Civil defense information service. You can ask about evacuation staging sites, emergency supply depots, or road closures.",
      time: "13:50 UTC"
    }
  ]);
  const [chatInput, setChatInput] = useState("");

  const currentLocation = PRESET_LOCATIONS[activeLocationIndex];

  // Submit report handler
  const handleSubmitReport = (e) => {
    e.preventDefault();
    if (!reportStreet.trim() || !reportDetail.trim()) {
      setReportError("Street location and description fields cannot be empty.");
      return;
    }

    submitCitizenReport({
      category: reportCategory,
      location: reportStreet.trim(),
      description: reportDetail.trim()
    });

    setReportError("");
    setReportStreet("");
    setReportDetail("");
    setIsReportModalOpen(false);
    setReportFeedback("Incident logged. Municipal response dispatch notified.");
    setTimeout(() => setReportFeedback(""), 5000);
  };

  // Chat message send handler
  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput.trim();
    const now = new Date();
    const timeStr = `${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')} UTC`;

    const newMsgs = [
      ...chatMessages,
      { sender: "user", text: userText, time: timeStr }
    ];

    setChatMessages(newMsgs);
    setChatInput("");

    // Calm, factual automated response
    setTimeout(() => {
      let reply = "Information confirmed. Current emergency personnel are deployed at primary river corridors. Please maintain situational awareness.";
      const query = userText.toLowerCase();

      if (query.includes("sandbag") || query.includes("sand")) {
        reply = "Municipal sandbag distribution is located at Civic Depot North, 440 Industrial Way. Operating 24 hours while advisories persist.";
      } else if (query.includes("evacuat") || query.includes("shelter")) {
        reply = "Designated secondary evacuation shelter: Highland Community Center, 120 Ridge Road. Emergency power and water stations active.";
      } else if (query.includes("water") || query.includes("drinking")) {
        reply = "Municipal water treatment plants are operating within nominal pressure. No boil-water advisory has been issued for Harbor Quarter.";
      } else if (query.includes("road") || query.includes("traffic") || query.includes("drive")) {
        reply = "Route 14 North closed due to utility line repairs. Use Highland Ridge bypass for east-west transit.";
      }

      setChatMessages((prev) => [
        ...prev,
        { sender: "assistant", text: reply, time: timeStr }
      ]);
    }, 450);
  };

  return (
    <div className="citizen-wrapper">
      <div className="citizen-device-frame">
        {/* Mobile Header */}
        <header className="citizen-header">
          <span className="citizen-header-title">Civil alert service</span>
          <button
            className="citizen-location-picker-btn"
            onClick={() => setShowLocationSelect(!showLocationSelect)}
            title="Switch simulated location"
          >
            Change location
          </button>
        </header>

        {/* Location Selector dropdown for simulation */}
        {showLocationSelect && (
          <div style={{ padding: '8px 16px', backgroundColor: '#EDE8DC', borderBottom: '1px solid #D5CFBF', fontSize: '12px' }}>
            <div style={{ marginBottom: '6px', fontWeight: 500 }}>Select simulated citizen location:</div>
            {PRESET_LOCATIONS.map((loc, idx) => (
              <div
                key={idx}
                onClick={() => {
                  setActiveLocationIndex(idx);
                  setShowLocationSelect(false);
                }}
                style={{
                  padding: '6px 8px',
                  cursor: 'pointer',
                  backgroundColor: activeLocationIndex === idx ? '#FFFFFF' : 'transparent',
                  border: activeLocationIndex === idx ? '1px solid #D5CFBF' : '1px solid transparent',
                  marginBottom: '3px'
                }}
              >
                {loc.name} ({loc.distance})
              </div>
            ))}
          </div>
        )}

        {/* Body Container */}
        <div className="citizen-body">
          {/* Feedback banner */}
          {reportFeedback && (
            <div
              className="citizen-guidance-card severity-border-safe"
              style={{ backgroundColor: '#FAF9F6' }}
            >
              <span className="citizen-guidance-title">Report received</span>
              <span className="citizen-guidance-text">{reportFeedback}</span>
            </div>
          )}

          {/* TOP: Location + current alert status in plain language */}
          <section className={`citizen-status-card severity-border-${currentLocation.severity}`}>
            <div className="citizen-location-row">
              <span className="citizen-location-name">{currentLocation.name}</span>
              <span className="citizen-time-badge">13:55 UTC</span>
            </div>

            <div className="citizen-alert-headline">
              <span className={`status-dot severity-${currentLocation.severity}`} />
              <span>{currentLocation.statusHeadline}</span>
            </div>

            <p className="citizen-alert-description">
              {currentLocation.statusDescription}
            </p>
          </section>

          {/* MIDDLE: Report button — one clear primary action, not buried in a menu */}
          <section className="citizen-primary-action-area">
            <button
              className="btn-citizen-report"
              onClick={() => setIsReportModalOpen(true)}
            >
              <span>Report incident</span>
            </button>
            <span className="citizen-report-hint">
              Log hazards directly with the regional emergency operations desk
            </span>
          </section>

          {/* Official Guidance Section */}
          <section className="citizen-info-section">
            <h3 className="citizen-section-title">Official preparedness guidance</h3>

            <div className="citizen-guidance-card severity-border-watch">
              <span className="citizen-guidance-title">Drainage retention check</span>
              <span className="citizen-guidance-text">
                Ensure perimeter drains and ground gutters remain unobstructed from foliage.
              </span>
            </div>

            <div className="citizen-guidance-card severity-border-safe">
              <span className="citizen-guidance-title">Emergency communications</span>
              <span className="citizen-guidance-text">
                Radio frequency 98.5 FM broadcasts continuous updates if cellular data slows.
              </span>
            </div>
          </section>

          {/* Recent Reports nearby */}
          <section className="citizen-info-section">
            <h3 className="citizen-section-title">Reports from your district</h3>
            <div className="citizen-recent-list">
              {citizenReports.length === 0 ? (
                <div style={{ fontSize: '12px', color: '#666', padding: '8px 0' }}>
                  No incidents reported nearby
                </div>
              ) : (
                citizenReports.slice(0, 3).map((rep) => (
                  <div key={rep.id} className="citizen-report-item severity-border-safe">
                    <div className="citizen-report-meta">
                      <span>{rep.location}</span>
                      <span className="citizen-time-badge">{rep.timestamp}</span>
                    </div>
                    <div className="citizen-report-text">
                      <strong>{rep.category}:</strong> {rep.description}
                    </div>
                    <div className="citizen-report-status">
                      {rep.status}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* BOTTOM: Chatbot access as a persistent but unobtrusive bar, not a floating bubble icon */}
        <div className="citizen-persistent-chat-bar">
          <button
            className="chat-bar-button"
            onClick={() => setIsChatOpen(true)}
            aria-label="Open emergency assistant chat"
          >
            <span className="chat-bar-placeholder">Ask emergency information assistant...</span>
            <span className="chat-bar-action-icon">&rarr;</span>
          </button>
        </div>

        {/* Incident Report Modal Sheet */}
        {isReportModalOpen && (
          <div className="citizen-modal-overlay">
            <div className="citizen-modal-sheet">
              <div className="citizen-modal-header">
                <span className="citizen-modal-title">Report hazardous incident</span>
                <button
                  className="citizen-modal-close-btn"
                  onClick={() => setIsReportModalOpen(false)}
                >
                  Close
                </button>
              </div>

              {reportError && (
                <div style={{ color: '#791F1F', fontSize: '12px', fontWeight: 500 }}>
                  {reportError}
                </div>
              )}

              <form onSubmit={handleSubmitReport} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="report-form-group">
                  <label className="report-label">Hazard category</label>
                  <select
                    className="report-select"
                    value={reportCategory}
                    onChange={(e) => setReportCategory(e.target.value)}
                  >
                    <option value="Water accumulation">Water accumulation / flood</option>
                    <option value="Road blocked">Downed tree / blocked road</option>
                    <option value="Power outage">Power line damage</option>
                    <option value="Structural damage">Damaged public structure</option>
                  </select>
                </div>

                <div className="report-form-group">
                  <label className="report-label">Street address or landmark</label>
                  <input
                    type="text"
                    className="report-input"
                    placeholder="e.g. 45 Harbor Way near Pier 9"
                    value={reportStreet}
                    onChange={(e) => setReportStreet(e.target.value)}
                  />
                </div>

                <div className="report-form-group">
                  <label className="report-label">Observed details</label>
                  <textarea
                    className="report-textarea"
                    placeholder="Describe water depth, vehicle access, or immediate dangers plainly."
                    value={reportDetail}
                    onChange={(e) => setReportDetail(e.target.value)}
                  />
                </div>

                <button type="submit" className="btn-submit-report">
                  Submit incident report
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Chatbot View Drawer */}
        {isChatOpen && (
          <div className="citizen-chat-drawer">
            <div className="chat-drawer-header">
              <span className="chat-drawer-title">Emergency assistant</span>
              <button
                className="citizen-modal-close-btn"
                onClick={() => setIsChatOpen(false)}
              >
                Close
              </button>
            </div>

            <div className="chat-messages-container">
              {chatMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`chat-bubble ${msg.sender} ${msg.sender === 'assistant' ? 'severity-border-watch' : ''}`}
                >
                  <div>{msg.text}</div>
                  <span className="chat-time">{msg.time}</span>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendChat} className="chat-input-bar">
              <input
                type="text"
                className="chat-text-input"
                placeholder="Ask about shelter, water, road access..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
              />
              <button type="submit" className="chat-send-btn">
                Send
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
