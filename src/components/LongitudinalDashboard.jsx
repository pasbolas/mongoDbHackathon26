import React from 'react';

export default function LongitudinalDashboard({ dashboardData }) {
  const { 
    currentIndependenceRate = 95, 
    weeklyProgression = [], 
    stepBreakdown = [] 
  } = dashboardData || {};

  return (
    <div className="space-y-6">
      
      {/* Intro */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
        <h2 className="text-xl font-bold text-white mb-1">
          Longitudinal Progress (Vanishing Assistance)
        </h2>
        <p className="text-base text-neutral-400">
          Over multiple weeks, the assistant tracks successful completions and progressively reduces prompts.
        </p>
      </div>

      {/* 3 Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
          <div className="text-sm font-medium text-neutral-400 mb-2">
            Current Independence Rate
          </div>
          <div className="text-4xl font-bold text-white font-mono">
            {currentIndependenceRate}%
          </div>
          <p className="text-sm text-neutral-400 mt-2">
            Up from 72% in Week 1.
          </p>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
          <div className="text-sm font-medium text-neutral-400 mb-2">
            Prompts Required per Routine
          </div>
          <div className="text-4xl font-bold text-white font-mono">
            1 <span className="text-base font-normal text-neutral-400">/ routine</span>
          </div>
          <p className="text-sm text-neutral-400 mt-2">
            Down from 7 prompts in Week 1.
          </p>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
          <div className="text-sm font-medium text-neutral-400 mb-2">
            Autonomous Steps (Level 0)
          </div>
          <div className="text-4xl font-bold text-white font-mono">
            4 <span className="text-base font-normal text-neutral-400">of 6 steps</span>
          </div>
          <p className="text-sm text-neutral-400 mt-2">
            Prompts withheld completely.
          </p>
        </div>

      </div>

      {/* Weekly Progress Bars */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 space-y-5">
        <h3 className="text-lg font-bold text-white">
          Weekly Independence Trajectory
        </h3>

        <div className="space-y-4">
          {weeklyProgression.map((week, idx) => (
            <div key={idx} className="space-y-2">
              <div className="flex items-center justify-between text-base">
                <span className="font-semibold text-white">
                  {week.weekLabel}
                </span>
                <div className="flex items-center space-x-4 text-sm">
                  <span className="text-neutral-400">
                    <strong className="text-neutral-200">{week.promptsNeeded}</strong> AI prompts
                  </span>
                  <span className="font-mono font-bold text-emerald-400">
                    {week.independenceRate}% Independent
                  </span>
                </div>
              </div>
              
              <div className="h-3 w-full bg-neutral-800 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all"
                  style={{ width: `${week.independenceRate}%` }}
                ></div>
              </div>

              <p className="text-xs text-neutral-400">
                {week.notes}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Step Breakdown Table */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
        <h3 className="text-lg font-bold text-white mb-4">
          Step-by-Step Cue Level Profiles
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-400">
                <th className="pb-3 px-3">Step</th>
                <th className="pb-3 px-3">Attempts</th>
                <th className="pb-3 px-3">Independent</th>
                <th className="pb-3 px-3">Rate</th>
                <th className="pb-3 px-3">Current Cue Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {stepBreakdown.map((s, idx) => (
                <tr key={idx} className="hover:bg-neutral-850">
                  <td className="py-3 px-3 font-medium text-white">{s.label}</td>
                  <td className="py-3 px-3 font-mono text-neutral-400">{s.attempts}</td>
                  <td className="py-3 px-3 font-mono text-emerald-400">{s.independent}</td>
                  <td className="py-3 px-3 font-mono text-white font-semibold">{s.independenceRate}%</td>
                  <td className="py-3 px-3">
                    <span className="px-2.5 py-1 rounded text-xs font-mono font-medium bg-neutral-800 text-neutral-300 border border-neutral-700">
                      {s.currentPromptLevel === 0 ? 'Level 0 (Autonomous)' : `Level ${s.currentPromptLevel} Cue`}
                    </span>
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
