import React from 'react';
import { 
  ShieldCheck, 
  Database, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Sparkles,
  BookOpen,
  Activity
} from 'lucide-react';

export default function Header({ 
  dbStatus, 
  soundEnabled, 
  setSoundEnabled, 
  onReset, 
  onOpenDbInspector,
  onSeedData,
  isSeeding 
}) {
  const isAtlas = dbStatus?.isAtlas;

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Logo & Philosophy Tagline */}
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-400/30">
              <ShieldCheck className="w-6 h-6 text-slate-950 font-bold" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center">
                  Adaptive Memory Guardian
                </h1>
                <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  MVP v1.0
                </span>
              </div>
              <p className="text-xs font-medium text-slate-400 flex items-center gap-1.5 mt-0.5">
                <span>The Goal:</span>
                <span className="text-emerald-400 font-semibold italic">"How little does AI need to do for you?"</span>
                <span className="hidden sm:inline text-slate-600">•</span>
                <span className="hidden sm:inline-flex items-center text-slate-400 text-[11px] gap-1">
                  <BookOpen className="w-3 h-3 text-emerald-400" />
                  Vanishing Cues Cognitive Rehabilitation
                </span>
              </p>
            </div>
          </div>

          {/* Action & Status Controls */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* MongoDB Atlas Status Button */}
            <button
              onClick={onOpenDbInspector}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                isAtlas 
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/40' 
                  : 'bg-teal-950/40 border-teal-500/30 text-teal-300 hover:bg-teal-900/40'
              }`}
              title="Click to view MongoDB Atlas Collections and Vector Index"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Database className="w-3.5 h-3.5" />
              <span>{isAtlas ? 'MongoDB Atlas' : 'Atlas Hybrid Engine'}</span>
              <span className="text-[10px] bg-slate-800/80 px-1.5 py-0.5 rounded text-slate-300">
                Vector Search
              </span>
            </button>

            {/* Sound Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                soundEnabled 
                  ? 'bg-indigo-950/50 border-indigo-500/30 text-indigo-300 hover:bg-indigo-900/50' 
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750'
              }`}
              title={soundEnabled ? 'Gentle voice prompts enabled' : 'Voice prompts muted'}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-indigo-400" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>{soundEnabled ? 'Voice On' : 'Voice Muted'}</span>
            </button>

            {/* Re-seed DB */}
            <button
              onClick={onSeedData}
              disabled={isSeeding}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-750 text-slate-300 text-xs font-medium transition-all disabled:opacity-50"
              title="Reset MongoDB baseline and longitudinal datasets"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{isSeeding ? 'Seeding...' : 'Seed Data'}</span>
            </button>

            {/* Reset Session */}
            <button
              onClick={onReset}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all"
              title="Reset current tea-making session to step 1"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset Run</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
