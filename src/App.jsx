import React, { useState } from 'react';
import { EmergencyProvider } from './context/EmergencyContext';
import AuthorityConsole from './components/authority/AuthorityConsole';
import CitizenApp from './components/citizen/CitizenApp';

export default function App() {
  // View mode: 'authority' | 'citizen' | 'split'
  const [viewMode, setViewMode] = useState('authority');

  return (
    <EmergencyProvider>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}>
        {/* Top Control Switcher Bar */}
        <header className="system-nav-bar">
          <div className="nav-left">
            <span style={{ fontWeight: 600, color: '#F6F4EF' }}>Emergency response operations</span>
            <span className="nav-badge">Live network</span>
          </div>

          <div className="nav-controls">
            <button
              className={`nav-tab-btn ${viewMode === 'authority' ? 'active' : ''}`}
              onClick={() => setViewMode('authority')}
            >
              Authority console
            </button>
            <button
              className={`nav-tab-btn ${viewMode === 'citizen' ? 'active' : ''}`}
              onClick={() => setViewMode('citizen')}
            >
              Citizen app
            </button>
            <button
              className={`nav-tab-btn ${viewMode === 'split' ? 'active' : ''}`}
              onClick={() => setViewMode('split')}
            >
              Side by side
            </button>
          </div>
        </header>

        {/* Viewports */}
        <div className="app-viewport">
          {viewMode === 'authority' && <AuthorityConsole />}

          {viewMode === 'citizen' && <CitizenApp />}

          {viewMode === 'split' && (
            <div style={{ display: 'flex', width: '100%', height: '100%' }}>
              <div style={{ flex: 1, height: '100%', overflow: 'hidden' }}>
                <AuthorityConsole />
              </div>
              <div style={{ width: '420px', minWidth: '400px', height: '100%', borderLeft: '2px solid #232D3B', overflow: 'hidden' }}>
                <CitizenApp />
              </div>
            </div>
          )}
        </div>
      </div>
    </EmergencyProvider>
  );
}
