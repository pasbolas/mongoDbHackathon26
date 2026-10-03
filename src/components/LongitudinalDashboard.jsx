import React from 'react';

export default function LongitudinalDashboard({ dashboardData }) {
  const { 
    currentIndependenceRate = 95, 
    weeklyProgression = [], 
    stepBreakdown = [] 
  } = dashboardData || {};

  return (
    <div className="space-y-8 max-w-3xl">
      
      {/* Intro Header */}
      <div>
        <h2 className="text-3xl font-semibold tracking-tight text-[#f5f5f7]">
          Longitudinal Independence
        </h2>
        <p className="text-base text-[#86868b] mt-1.5 leading-relaxed">
          Over multiple weeks, the assistant observes successful completions and gradually withdraws assistance using vanishing cues.
        </p>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="rounded-2xl border border-[#242427] bg-[#141416] p-6 space-y-1">
          <div className="text-xs font-medium uppercase tracking-wider text-[#86868b]">
            Independence Rate
          </div>
          <div className="text-4xl font-semibold tracking-tight text-white font-mono">
            {currentIndependenceRate}%
          </div>
          <p className="text-xs text-[#86868b] pt-1">
            Up from 72% in Week 1.
          </p>
        </div>

        <div className="rounded-2xl border border-[#242427] bg-[#141416] p-6 space-y-1">
          <div className="text-xs font-medium uppercase tracking-wider text-[#86868b]">
            Prompts Required
          </div>
          <div className="text-4xl font-semibold tracking-tight text-white font-mono">
            1 <span className="text-sm font-normal text-[#86868b]">/ run</span>
          </div>
          <p className="text-xs text-[#86868b] pt-1">
            Down from 7 prompts in Week 1.
          </p>
        </div>

        <div className="rounded-2xl border border-[#242427] bg-[#141416] p-6 space-y-1">
          <div className="text-xs font-medium uppercase tracking-wider text-[#86868b]">
            Vanished Steps
          </div>
          <div className="text-4xl font-semibold tracking-tight text-white font-mono">
            4 <span className="text-sm font-normal text-[#86868b]">of 6</span>
          </div>
          <p className="text-xs text-[#86868b] pt-1">
            Prompts withheld completely.
          </p>
        </div>

      </div>

      {/* Weekly Progress Bars */}
      <div className="rounded-3xl border border-[#242427] bg-[#141416] p-7 sm:p-8 space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-[#f5f5f7]">
            Weekly Progression Trajectory
          </h3>
          <p className="text-sm text-[#86868b] mt-0.5">
            Documented in MongoDB Atlas `longitudinal_metrics` collection
          </p>
        </div>

        <div className="space-y-5">
          {weeklyProgression.map((week, idx) => (
            <div key={idx} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-[#f5f5f7]">
                  {week.weekLabel}
                </span>
                <div className="flex items-center space-x-3 text-xs">
                  <span className="text-[#86868b]">
                    {week.promptsNeeded} prompts needed
                  </span>
                  <span className="font-mono font-semibold text-emerald-400">
                    {week.independenceRate}%
                  </span>
                </div>
              </div>
              
              <div className="h-2 w-full bg-[#1c1c1f] rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${week.independenceRate}%` }}
                ></div>
              </div>

              <p className="text-xs text-[#6e6e73]">
                {week.notes}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Step Breakdown Table */}
      <div className="rounded-3xl border border-[#242427] bg-[#141416] p-7 sm:p-8 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-[#f5f5f7]">
            Step Assistance Profiles
          </h3>
          <p className="text-sm text-[#86868b] mt-0.5">
            Errorless learning profiles stored in MongoDB Atlas `routines.assistance`
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#242427] text-xs uppercase tracking-wider text-[#86868b]">
                <th className="pb-3 px-3">Step</th>
                <th className="pb-3 px-3">Attempts</th>
                <th className="pb-3 px-3">Independent</th>
                <th className="pb-3 px-3">Mastery</th>
                <th className="pb-3 px-3">Current Cue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1c1c20]">
              {stepBreakdown.map((s, idx) => (
                <tr key={idx} className="hover:bg-[#19191c] transition-colors">
                  <td className="py-3 px-3 font-medium text-[#f5f5f7]">{s.label}</td>
                  <td className="py-3 px-3 font-mono text-[#86868b]">{s.attempts}</td>
                  <td className="py-3 px-3 font-mono text-emerald-400">{s.independent}</td>
                  <td className="py-3 px-3 font-mono text-[#f5f5f7]">{s.independenceRate}%</td>
                  <td className="py-3 px-3">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono text-[#a1a1a6] bg-[#1c1c1f] border border-[#2c2c30]">
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
