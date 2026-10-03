import React from 'react';
import { Volume2, VolumeX, RotateCcw, Database } from 'lucide-react';

export default function Header({ 
  activeTab, 
  setActiveTab, 
  dbStatus, 
  soundEnabled, 
  setSoundEnabled, 
  onReset 
}) {
  const tabs = [
    { id: 'live', label: 'Live Routine' },
    { id: 'scenarios', label: 'Demo Scenarios' },
    { id: 'progress', label: 'Longitudinal Progress' },
    { id: 'database', label: 'MongoDB Atlas' },
  ];

  return (
    <header className="border-b border-neutral-800 bg-neutral-950 px-6 py-4">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Simple title and tagline */}
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Adaptive Memory Guardian
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded font-medium bg-neutral-850 text-neutral-400 border border-neutral-800">
              MVP
            </span>
          </div>
          <p className="text-sm text-neutral-400 mt-0.5">
            Intervening as little as possible to support independence.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-3">
          {/* Sound toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-neutral-800 text-sm font-medium text-neutral-300 hover:bg-neutral-900 transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-neutral-500" />}
            <span>{soundEnabled ? 'Voice On' : 'Voice Off'}</span>
          </button>

          {/* Reset run */}
          <button
            onClick={onReset}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-neutral-800 text-sm font-medium text-neutral-300 hover:bg-neutral-900 transition-colors"
          >
            <RotateCcw className="w-4 h-4 text-neutral-400" />
            <span>Reset</span>
          </button>

          {/* Database indicator */}
          <button
            onClick={() => setActiveTab('database')}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-neutral-800 text-sm font-medium text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 transition-colors"
          >
            <span className={`w-2 h-2 rounded-full ${dbStatus?.isAtlas ? 'bg-emerald-400' : 'bg-teal-400'}`}></span>
            <span>{dbStatus?.isAtlas ? 'Atlas Connected' : 'Local Store'}</span>
          </button>
        </div>

      </div>

      {/* Main Tab Navigation */}
      <div className="max-w-6xl mx-auto mt-4 pt-2 border-t border-neutral-900 flex space-x-2 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-neutral-800 text-white font-semibold'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </header>
  );
}
