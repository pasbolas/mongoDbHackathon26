import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header.jsx';
import ScenarioBar from './components/ScenarioBar.jsx';
import KitchenSimulator from './components/KitchenSimulator.jsx';
import GuardianCopilot from './components/GuardianCopilot.jsx';
import LongitudinalDashboard from './components/LongitudinalDashboard.jsx';
import AtlasInspectorModal from './components/AtlasInspectorModal.jsx';
import { speechService } from './utils/speech.js';
import confetti from 'canvas-confetti';
import { Info, ExternalLink } from 'lucide-react';

export default function App() {
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
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [isRunningScenario, setIsRunningScenario] = useState(false);
  const [isPerformingAction, setIsPerformingAction] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  // Sync sound toggle to speechService
  useEffect(() => {
    speechService.toggle(soundEnabled);
  }, [soundEnabled]);

  // Initial data loading
  useEffect(() => {
    fetchState();
    fetchDashboard();
    fetchDbStatus();
  }, []);

  // Real-time Server-Sent Events (SSE) listener
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
            // Celebrate independent execution!
            try {
              confetti({
                particleCount: 80,
                spread: 70,
                origin: { y: 0.6 }
              });
            } catch (e) {
              console.warn('Confetti error:', e);
            }
            fetchDashboard();
          }
        } catch (err) {
          console.error('SSE parse error:', err);
        }
      };

      eventSource.onerror = () => {
        // SSE auto-reconnects
      };
    } catch (e) {
      console.warn('EventSource failed:', e);
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

  const handleSeedData = async () => {
    setIsSeeding(true);
    speechService.stop();
    try {
      const res = await fetch('/api/db/seed', { method: 'POST' });
      const data = await res.json();
      if (data.dashboard) setDashboardData(data.dashboard);
      fetchState();
      fetchDbStatus();
    } catch (err) {
      console.error('Seed failed:', err);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleRunScenario = async (scenarioId) => {
    setIsRunningScenario(true);
    speechService.stop();
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      
      {/* Top Navigation */}
      <Header
        dbStatus={dbStatus}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        onReset={handleReset}
        onOpenDbInspector={() => setIsInspectorOpen(true)}
        onSeedData={handleSeedData}
        isSeeding={isSeeding}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Core Philosophy Banner */}
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900/60 to-indigo-950/40 border border-emerald-500/20 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start space-x-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mt-0.5">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-white tracking-wide uppercase">
                The Reversal Principle: Vanishing Assistance
              </h2>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                Most AI assistants optimize for doing <em>more</em>. For someone living with dementia, Adaptive Memory Guardian optimizes for doing <strong>less</strong>. It recognizes when John can perform tasks independently, withholds cues, and provides only the minimum necessary prompt.
              </p>
            </div>
          </div>
          <div className="flex-shrink-0 text-right">
            <span className="text-[11px] font-mono text-emerald-400 font-semibold block">
              MongoDB Atlas Longitudinal Memory
            </span>
            <span className="text-[10px] text-slate-400">
              Vector Search + Time-Series Events
            </span>
          </div>
        </div>

        {/* Judging Scenarios Bar */}
        <ScenarioBar
          onRunScenario={handleRunScenario}
          isRunningScenario={isRunningScenario}
        />

        {/* 2-Column Physical Simulator & Copilot Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column (7 cols): Physical Kitchen Simulator */}
          <div className="lg:col-span-7">
            <KitchenSimulator
              state={state}
              onAction={handleAction}
              onIdle={handleIdle}
              isPerformingAction={isPerformingAction || isRunningScenario}
            />
          </div>

          {/* Right Column (5 cols): Guardian Copilot */}
          <div className="lg:col-span-5">
            <GuardianCopilot
              state={state}
              soundEnabled={soundEnabled}
            />
          </div>

        </div>

        {/* Longitudinal Dashboard */}
        {dashboardData && (
          <LongitudinalDashboard
            dashboardData={dashboardData}
          />
        )}

      </main>

      {/* Footer & Research Citations */}
      <footer className="border-t border-slate-800 bg-slate-950/80 py-6 mt-12 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <span className="font-bold text-slate-300">Adaptive Memory Guardian</span> — Built for the MongoDB Hackathon 2026.
            <span className="text-slate-400 ml-2">Powered by MongoDB Atlas Vector Search & Time-Series.</span>
          </div>
          <div className="flex items-center space-x-4 text-[11px]">
            <span className="text-slate-400">Errorless Learning & Vanishing Cues Research (PubMed Central)</span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-400">Just-in-Time Interventions (NIA)</span>
          </div>
        </div>
      </footer>

      {/* MongoDB Atlas Inspector Modal */}
      <AtlasInspectorModal
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        dbStatus={dbStatus}
        onConnectUri={fetchDbStatus}
      />

    </div>
  );
}
