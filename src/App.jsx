import React, { useState, useEffect } from 'react';
import Header from './components/Header.jsx';
import LiveRoutineView from './components/LiveRoutineView.jsx';
import ScenariosView from './components/ScenariosView.jsx';
import LongitudinalDashboard from './components/LongitudinalDashboard.jsx';
import DatabaseView from './components/DatabaseView.jsx';
import { speechService } from './utils/speech.js';

export default function App() {
  const [activeTab, setActiveTab] = useState('live');
  const [state, setState] = useState({
    user: 'John',
    task: 'make_tea',
    state: 'OBSERVING_SILENT',
    currentStepIndex: 0,
    currentStep: null,
    totalSteps: 6,
    idleSeconds: 0,
    activePrompt: null,
    actionHistory: [],
    stepOutcomes: [],
    simulation: {}
  });

  const [dashboardData, setDashboardData] = useState(null);
  const [dbStatus, setDbStatus] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isRunningScenario, setIsRunningScenario] = useState(false);
  const [isPerformingAction, setIsPerformingAction] = useState(false);

  useEffect(() => {
    speechService.toggle(soundEnabled);
  }, [soundEnabled]);

  useEffect(() => {
    fetchState();
    fetchDashboard();
    fetchDbStatus();
  }, []);

  // Real-time SSE streaming
  useEffect(() => {
    let eventSource;
    try {
      eventSource = new EventSource('/api/events/stream');

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          
          if (payload.event === 'CONNECTED' || payload.event === 'STATE_RESET') {
            setState(payload.data);
          } else if (payload.event === 'ACTION_PERCEIVED' || payload.event === 'IDLE_UPDATED') {
            setState(payload.data.state);
          } else if (payload.event === 'INTERVENTION_TRIGGERED' || payload.event === 'INTERVENTION_ESCALATED') {
            setState(payload.data.state);
            if (payload.data.prompt?.text) {
              speechService.speak(payload.data.prompt.text);
            }
          } else if (payload.event === 'ROUTINE_COMPLETE') {
            fetchDashboard();
          }
        } catch (err) {
          console.error('SSE parse error:', err);
        }
      };
    } catch (e) {
      console.warn('EventSource error:', e);
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, []);

  const fetchState = async () => {
    try {
      const res = await fetch('/api/state');
      const data = await res.json();
      setState(data);
    } catch (err) {
      console.error('Failed to fetch state:', err);
    }
  };

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/dashboard');
      const data = await res.json();
      setDashboardData(data);
    } catch (err) {
      console.error('Failed to fetch dashboard:', err);
    }
  };

  const fetchDbStatus = async () => {
    try {
      const res = await fetch('/api/db/status');
      const data = await res.json();
      setDbStatus(data);
    } catch (err) {
      console.error('Failed to fetch db status:', err);
    }
  };

  const handleAction = async (actionKey, metadata = {}) => {
    setIsPerformingAction(true);
    try {
      const res = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: actionKey, metadata })
      });
      const newState = await res.json();
      setState(newState);
      fetchDashboard();
    } catch (err) {
      console.error('Action failed:', err);
    } finally {
      setIsPerformingAction(false);
    }
  };

  const handleIdle = async (seconds = 5) => {
    try {
      const res = await fetch('/api/idle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seconds })
      });
      const newState = await res.json();
      setState(newState);
    } catch (err) {
      console.error('Idle simulation failed:', err);
    }
  };

  const handleReset = async () => {
    speechService.stop();
    try {
      const res = await fetch('/api/reset', { method: 'POST' });
      const data = await res.json();
      setState(data.state);
    } catch (err) {
      console.error('Reset failed:', err);
    }
  };

  const handleRunScenario = async (scenarioId) => {
    setIsRunningScenario(true);
    speechService.stop();
    // Switch to live routine tab so the user can watch the scenario unfold
    setActiveTab('live');
    try {
      await fetch('/api/scenarios/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId })
      });
    } catch (err) {
      console.error('Failed to run scenario:', err);
    } finally {
      setTimeout(() => setIsRunningScenario(false), 5000);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      
      {/* Tab Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        dbStatus={dbStatus}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        onReset={handleReset}
      />

      {/* Main Tab Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">
        
        {activeTab === 'live' && (
          <LiveRoutineView
            state={state}
            onAction={handleAction}
            onIdle={handleIdle}
            isPerformingAction={isPerformingAction || isRunningScenario}
            soundEnabled={soundEnabled}
          />
        )}

        {activeTab === 'scenarios' && (
          <ScenariosView
            onRunScenario={handleRunScenario}
            isRunningScenario={isRunningScenario}
          />
        )}

        {activeTab === 'progress' && (
          <LongitudinalDashboard
            dashboardData={dashboardData}
          />
        )}

        {activeTab === 'database' && (
          <DatabaseView
            dbStatus={dbStatus}
            onRefreshDbStatus={fetchDbStatus}
          />
        )}

      </main>

      {/* Minimal Clean Footer */}
      <footer className="border-t border-neutral-800 bg-neutral-950 py-6 text-neutral-400 text-sm px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <strong className="text-neutral-300">Adaptive Memory Guardian</strong> — Vanishing AI assistance for dementia.
          </div>
          <div className="text-xs text-neutral-400">
            Powered by MongoDB Atlas Vector Search
          </div>
        </div>
      </footer>

    </div>
  );
}
