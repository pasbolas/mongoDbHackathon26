import React from 'react';

export default function LongitudinalDashboard({ dashboardData }) {
  const { 
    currentIndependenceRate = 95, 
    weeklyProgression = [], 
    stepBreakdown = [] 
  } = dashboardData || {};

  return (
    <div className="space-y-8 max-w-3xl font-mono">
      
      {/* Intro Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-[#1d1d1f]">
          Longitudinal Independence
        </h2>
        <p className="text-base text-[#6e6e73] mt-1.5 leading-relaxed">
          Over multiple weeks, the assistant observes successful completions and gradually withdraws assistance using vanishing cues.
        </p>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="rounded-2xl border border-[#e5e5ea] bg-white p-6 space-y-1 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#86868b]">
            Independence Rate
          </div>
          <div className="text-4xl font-bold tracking-tight text-[#1d1d1f]">
            {currentIndependenceRate}%
          </div>
          <p className="text-xs text-[#6e6e73] pt-1">
            Up from 72% in Week 1.
          </p>
        </div>

        <div className="rounded-2xl border border-[#e5e5ea] bg-white p-6 space-y-1 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#86868b]">
            Prompts Required
          </div>
          <div className="text-4xl font-bold tracking-tight text-[#1d1d1f]">
            1 <span className="text-sm font-normal text-[#86868b]">/ run</span>
          </div>
          <p className="text-xs text-[#6e6e73] pt-1">
            Down from 7 prompts in Week 1.
          </p>
        </div>

        <div className="rounded-2xl border border-[#e5e5ea] bg-white p-6 space-y-1 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#86868b]">
            Vanished Steps
          </div>
          <div className="text-4xl font-bold tracking-tight text-[#1d1d1f]">
            4 <span className="text-sm font-normal text-[#86868b]">of 6</span>
          </div>
          <p className="text-xs text-[#6e6e73] pt-1">
            Prompts withheld completely.
          </p>
        </div>

      </div>

      {/* Weekly Progress Bars */}
      <div className="rounded-3xl border border-[#e5e5ea] bg-white p-7 sm:p-8 space-y-6 shadow-sm">
        <div>
          <h3 className="text-lg font-bold text-[#1d1d1f]">
            Weekly Progression Trajectory
          </h3>
          <p className="text-sm text-[#6e6e73] mt-0.5">
            Documented in MongoDB Atlas `longitudinal_metrics` collection
          </p>
        </div>

        <div className="space-y-5">
          {weeklyProgression.map((week, idx) => (
            <div key={idx} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-[#1d1d1f]">
                  {week.weekLabel}
                </span>
                <div className="flex items-center space-x-3 text-xs">
                  <span className="text-[#6e6e73]">
                    {week.promptsNeeded} prompts needed
                  </span>
                  <span className="font-bold text-emerald-700">
                    {week.independenceRate}%
                  </span>
                </div>
              </div>
              
              <div className="h-2 w-full bg-[#e5e5ea] rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${week.independenceRate}%` }}
                ></div>
              </div>

              <p className="text-xs text-[#86868b]">
                {week.notes}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Step Breakdown Table */}
      <div className="rounded-3xl border border-[#e5e5ea] bg-white p-7 sm:p-8 space-y-4 shadow-sm">
        <div>
          <h3 className="text-lg font-bold text-[#1d1d1f]">
            Step Assistance Profiles
          </h3>
          <p className="text-sm text-[#6e6e73] mt-0.5">
            Errorless learning profiles stored in MongoDB Atlas `routines.assistance`
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#e5e5ea] text-xs uppercase tracking-wider text-[#86868b]">
                <th className="pb-3 px-3">Step</th>
                <th className="pb-3 px-3">Attempts</th>
                <th className="pb-3 px-3">Independent</th>
                <th className="pb-3 px-3">Mastery</th>
                <th className="pb-3 px-3">Current Cue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e5ea]">
              {stepBreakdown.map((s, idx) => (
                <tr key={idx} className="hover:bg-[#fbfbfd] transition-colors">
                  <td className="py-3 px-3 font-semibold text-[#1d1d1f]">{s.label}</td>
                  <td className="py-3 px-3 text-[#6e6e73]">{s.attempts}</td>
                  <td className="py-3 px-3 text-emerald-700 font-semibold">{s.independent}</td>
                  <td className="py-3 px-3 text-[#1d1d1f] font-semibold">{s.independenceRate}%</td>
                  <td className="py-3 px-3">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium text-[#1d1d1f] bg-[#f5f5f7] border border-[#d1d1d6]">
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
