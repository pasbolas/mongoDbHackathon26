import React from 'react';
import { 
  TrendingUp, 
  Award, 
  Sparkles, 
  HelpCircle, 
  ArrowDownRight, 
  ShieldCheck, 
  CheckCircle,
  Clock,
  Layers,
  BarChart3
} from 'lucide-react';

export default function LongitudinalDashboard({ dashboardData }) {
  const { 
    currentIndependenceRate = 95, 
    weeklyProgression = [], 
    stepBreakdown = [] 
  } = dashboardData || {};

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl mt-6">
      
      {/* Title & Research Rationale Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-5 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Longitudinal Independence Dashboard
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Tracking vanishing cues across sessions in MongoDB Atlas. Notice how AI intervention steadily decreases over time.
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-emerald-950/40 border border-emerald-500/30 px-3.5 py-1.5 rounded-xl">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold text-emerald-300">
            System Goal: AI making itself unnecessary
          </span>
        </div>
      </div>

      {/* 4 Key Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 my-6">
        
        {/* Metric 1: Independence Rate */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Independence Rate</span>
            <span className="text-emerald-400 text-[10px] font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded">
              +23% gain
            </span>
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {currentIndependenceRate}%
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Steps completed without needing cues
          </p>
        </div>

        {/* Metric 2: AI Interventions Required */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>AI Prompts Needed</span>
            <span className="text-cyan-400 text-[10px] font-semibold bg-cyan-500/10 px-1.5 py-0.5 rounded">
              -85% decrease
            </span>
          </div>
          <div className="text-2xl font-black text-cyan-400 font-mono">
            1 <span className="text-xs text-slate-400 font-sans font-normal">/ routine (was 7)</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Average prompts delivered per tea routine
          </p>
        </div>

        {/* Metric 3: Fully Autonomous Steps */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Vanished Steps</span>
            <span className="text-indigo-400 text-[10px] font-semibold bg-indigo-500/10 px-1.5 py-0.5 rounded">
              Level 0
            </span>
          </div>
          <div className="text-2xl font-black text-indigo-300 font-mono">
            4 <span className="text-xs text-slate-400 font-sans font-normal">of 6 steps</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Assistance successfully withheld completely
          </p>
        </div>

        {/* Metric 4: Cognitive Hesitation */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Average Hesitation</span>
            <span className="text-amber-400 text-[10px] font-semibold bg-amber-500/10 px-1.5 py-0.5 rounded">
              -16s latency
            </span>
          </div>
          <div className="text-2xl font-black text-amber-300 font-mono">
            12s <span className="text-xs text-slate-400 font-sans font-normal">(was 28s)</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Time between steps before action is initiated
          </p>
        </div>

      </div>

      {/* Longitudinal Weekly Progress Bars (The Pitch Highlight) */}
      <div className="bg-slate-950/60 rounded-xl p-5 border border-slate-800 mb-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            Weekly Longitudinal Trajectory (Simulated 4-Week Cohort)
          </span>
          <span className="text-[11px] font-mono text-emerald-400">
            Stored in MongoDB `longitudinal_metrics`
          </span>
        </div>

        <div className="space-y-4">
          {weeklyProgression.map((week, idx) => (
            <div key={idx} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">
                  {week.weekLabel}
                </span>
                <div className="flex items-center space-x-3 text-[11px]">
                  <span className="text-slate-400">
                    <strong className="text-slate-200">{week.promptsNeeded}</strong> AI prompts
                  </span>
                  <span className="font-mono font-bold text-emerald-400">
                    {week.independenceRate}% Independent
                  </span>
                </div>
              </div>
              
              {/* Visual Progress Bar */}
              <div className="h-3 w-full bg-slate-800/80 rounded-full overflow-hidden flex">
                <div 
                  className="bg-gradient-to-r from-emerald-600 to-teal-400 h-full rounded-full transition-all duration-700"
                  style={{ width: `${week.independenceRate}%` }}
                ></div>
              </div>

              <p className="text-[11px] text-slate-400 italic">
                {week.notes}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Step-by-Step Vanishing Cues Matrix */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-indigo-400" />
            Task Sequence Assistance Profiles (Errorless Learning Breakdown)
          </span>
          <span className="text-[11px] text-slate-400">
            From MongoDB `routines.assistance`
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                <th className="py-2.5 px-3">Step</th>
                <th className="py-2.5 px-3">Attempts</th>
                <th className="py-2.5 px-3">Solo Completions</th>
                <th className="py-2.5 px-3">Independence</th>
                <th className="py-2.5 px-3">Current Cue Level</th>
                <th className="py-2.5 px-3">Hesitation Grace</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {stepBreakdown.map((s, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-slate-200 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span>{s.label}</span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-400">{s.attempts}</td>
                  <td className="py-2.5 px-3 font-mono text-emerald-400 font-semibold">{s.independent}</td>
                  <td className="py-2.5 px-3 font-mono">
                    <span className="font-bold text-white">{s.independenceRate}%</span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium ${
                      s.currentPromptLevel === 0 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : s.currentPromptLevel === 1
                        ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                        : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                    }`}>
                      {s.currentPromptLevel === 0 ? 'Level 0 (Autonomous)' : `Level ${s.currentPromptLevel} Cue`}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-400">
                    {s.thresholdSeconds || 15}s threshold
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
