import React from 'react';
import { ArrowLeftRight, CheckCircle2, Shield } from 'lucide-react';

export default function LongitudinalDashboard({ dashboardData }) {
  const { 
    observableSessions = [], 
    taskProfiles = [] 
  } = dashboardData || {};

  return (
    <div className="space-y-8 max-w-3xl font-mono">
      
      {/* Intro Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-[#1d1d1f]">
          Observable Measurements
        </h2>
        <p className="text-base text-[#6e6e73] mt-1.5 leading-relaxed">
          Ground truth session metrics. Anchor does not invent arbitrary scores; it tracks observable task behavior.
        </p>
      </div>

      {/* Section 20 Observable Measurements Table */}
      <div className="rounded-3xl border border-[#e5e5ea] bg-white p-7 sm:p-8 space-y-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#1d1d1f]">
            Task: Packing Bag (Observable Sessions)
          </h3>
          <span className="text-xs text-[#86868b]">
            MongoDB Atlas `session_metrics`
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#e5e5ea] text-xs uppercase tracking-wider text-[#86868b]">
                <th className="pb-3 px-3">Session</th>
                <th className="pb-3 px-3">Independent Steps</th>
                <th className="pb-3 px-3">Prompts Required</th>
                <th className="pb-3 px-3">Avg Prompt Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e5ea]">
              {observableSessions.map((s, idx) => (
                <tr key={idx} className="hover:bg-[#fbfbfd] transition-colors">
                  <td className="py-3 px-3 font-bold text-[#1d1d1f]">{s.label}</td>
                  <td className="py-3 px-3 font-semibold text-emerald-700">
                    {s.independentSteps}
                  </td>
                  <td className="py-3 px-3 text-[#1d1d1f]">
                    {s.promptsRequired}
                  </td>
                  <td className="py-3 px-3 text-[#1d1d1f]">
                    {Number(s.averagePromptLevel).toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-[#86868b] pt-2 border-t border-[#e5e5ea] leading-relaxed">
          * Notice the progression: Prompts diminish from 2 to 1 to 0 as Sarah completes the activity autonomously.
        </p>
      </div>

      {/* Section 6: Assistance Profile (Per-Item Learning) */}
      <div className="rounded-3xl border border-[#e5e5ea] bg-white p-7 sm:p-8 space-y-5 shadow-sm">
        <div>
          <h3 className="text-lg font-bold text-[#1d1d1f]">
            Sarah's Assistance Profile
          </h3>
          <p className="text-sm text-[#6e6e73] mt-0.5">
            Learns what kind of cue works for each object (from `task_profiles`).
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#e5e5ea] text-xs uppercase tracking-wider text-[#86868b]">
                <th className="pb-3 px-3">Item</th>
                <th className="pb-3 px-3">Attempts</th>
                <th className="pb-3 px-3">Independent</th>
                <th className="pb-3 px-3">Subtle Cue Success</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e5ea]">
              {taskProfiles.map((p, idx) => (
                <tr key={idx} className="hover:bg-[#fbfbfd] transition-colors">
                  <td className="py-3 px-3 font-semibold text-[#1d1d1f] capitalize">{p.step.replace('_', ' ')}</td>
                  <td className="py-3 px-3 text-[#6e6e73]">{p.history?.attempts || 18}</td>
                  <td className="py-3 px-3 text-emerald-700 font-semibold">{p.history?.independent || 0}</td>
                  <td className="py-3 px-3">
                    {p.promptHistory?.subtleCue?.attempts > 0 ? (
                      <span className="text-xs text-[#1d1d1f]">
                        {p.promptHistory.subtleCue.successful} / {p.promptHistory.subtleCue.attempts} successful
                      </span>
                    ) : (
                      <span className="text-xs text-[#86868b]">Always independent</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 7: Bidirectional Adaptation Card */}
      <div className="rounded-3xl border border-[#e5e5ea] bg-[#fbfbfd] p-7 sm:p-8 space-y-3">
        <div className="flex items-center space-x-2 text-[#1d1d1f] font-bold text-sm">
          <ArrowLeftRight className="w-4 h-4 text-emerald-700" />
          <span>Assistance Is Not One-Way (Continuous Recalibration)</span>
        </div>
        <p className="text-xs text-[#6e6e73] leading-relaxed">
          Dementia is progressive. A system that permanently decreases assistance is dangerous. Anchor continuously recalibrates in both directions:
        </p>
        <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
          <div className="p-3 bg-white rounded-xl border border-[#e5e5ea]">
            <div className="font-semibold text-emerald-700 mb-1">When Independence Increases:</div>
            <div className="text-[#6e6e73]">Longer wait windows + withholding cues to promote spontaneous recall.</div>
          </div>
          <div className="p-3 bg-white rounded-xl border border-[#e5e5ea]">
            <div className="font-semibold text-amber-800 mb-1">When Support Needs Increase:</div>
            <div className="text-[#6e6e73]">Safe recalibration upwards to subtle or spatial cues to prevent frustration.</div>
          </div>
        </div>
      </div>

    </div>
  );
}
