import React from 'react';
import { Play, CheckCircle2, AlertCircle, TrendingUp, HelpCircle } from 'lucide-react';

export default function ScenarioBar({ onRunScenario, isRunningScenario }) {
  const scenarios = [
    {
      id: 'independent',
      title: 'Scenario 1: Full Independence',
      subtitle: 'Silence is the feature (AI does nothing)',
      badge: 'Zero AI Prompts',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      icon: CheckCircle2,
      borderColor: 'hover:border-emerald-500/50',
      desc: 'John performs all steps correctly. AI stays quiet and celebrates 100% independent completion.'
    },
    {
      id: 'confusion_mug',
      title: 'Scenario 2: Loop Confusion',
      subtitle: 'Cupboard checking → Level 1 nudge',
      badge: 'Atlas Vector Search',
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      icon: AlertCircle,
      borderColor: 'hover:border-amber-500/50',
      desc: 'John repeatedly checks cupboard. Vector Search matches 94% past confusion → Level 1 prompt given.'
    },
    {
      id: 'escalation',
      title: 'Scenario 3: Multi-Level Escalation',
      subtitle: 'Persistent hesitation → Level 2 cue',
      badge: 'Adaptive Escalation',
      badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      icon: TrendingUp,
      borderColor: 'hover:border-rose-500/50',
      desc: 'Level 1 prompt ignored → engine smoothly escalates to Level 2. Once resolved, AI immediately stops.'
    }
  ];

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-sm mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Interactive Judge Scenarios
          </span>
          <span className="text-[11px] text-slate-500 hidden md:inline">
            (One-click automated walkthroughs demonstrating core innovations)
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {scenarios.map(sc => {
          const Icon = sc.icon;
          return (
            <button
              key={sc.id}
              onClick={() => onRunScenario(sc.id)}
              disabled={isRunningScenario}
              className={`text-left p-3.5 rounded-xl bg-slate-850/60 border border-slate-800 transition-all ${sc.borderColor} hover:bg-slate-800/80 group disabled:opacity-50 relative overflow-hidden`}
            >
              <div className="flex items-start justify-between mb-1.5">
                <div className="flex items-center space-x-2">
                  <Icon className="w-4 h-4 text-slate-300 group-hover:text-emerald-400 transition-colors" />
                  <span className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                    {sc.title}
                  </span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded border font-mono ${sc.badgeColor}`}>
                  {sc.badge}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium mb-1">{sc.subtitle}</p>
              <p className="text-[11px] text-slate-500 leading-relaxed">{sc.desc}</p>
              
              <div className="mt-2.5 flex items-center space-x-1 text-[11px] font-semibold text-emerald-400 opacity-90 group-hover:opacity-100 transition-all">
                <Play className="w-3 h-3 fill-emerald-400" />
                <span>Run Demonstration</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
