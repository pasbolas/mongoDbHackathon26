import React from 'react';
import { Play } from 'lucide-react';

export default function ScenariosView({ onRunScenario, isRunningScenario }) {
  const executions = [
    {
      id: 'execution_1',
      title: 'First Execution: Subtle Prompt',
      subtitle: 'System waits, detects uncertainty, offers minimal verbal question.',
      story: [
        'Sarah packs wallet, keys, and phone, then stops.',
        'System deliberately waits 15+ seconds to avoid premature interruption.',
        'After sufficient uncertainty, Anchor asks: "Anything else you normally take with you?"',
        'Sarah remembers her notebook. MongoDB records: subtle cue successful.'
      ],
      badge: 'Subtle Cue: "Anything else?"'
    },
    {
      id: 'execution_2',
      title: 'Second Execution: Shorter Nudge',
      subtitle: 'Atlas Vector Search retrieves past success; system shortens prompt.',
      story: [
        'Sarah pauses at the exact same point after packing phone.',
        'Atlas Vector Search retrieves Episode #17 where a subtle cue worked.',
        'Anchor adapts by giving an even more minimal nudge: "Anything else?"',
        'Sarah adds the notebook. Assistance continues to diminish.'
      ],
      badge: 'Atlas Vector Search ($vectorSearch)'
    },
    {
      id: 'execution_3',
      title: 'Third Execution: Anchor Does Nothing',
      subtitle: 'The demo moment: Sarah pauses, remembers alone, Anchor stays silent.',
      story: [
        'Sarah packs wallet, keys, and phone, and pauses briefly.',
        'Anchor observes and patiently waits.',
        'Sarah remembers her notebook herself and packs it.',
        'Anchor says NOTHING. The AI deliberate silence is the achievement.'
      ],
      badge: 'AI Silence (Zero Prompts)'
    }
  ];

  return (
    <div className="space-y-8 max-w-3xl font-mono">
      
      {/* Intro Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-[#1d1d1f]">
          Demo Executions
        </h2>
        <p className="text-base text-[#6e6e73] mt-1.5 leading-relaxed">
          The 3-stage progression from Section 19 demonstrating how Anchor learns to intervene less over time.
        </p>
      </div>

      {/* Stacked Execution Cards */}
      <div className="space-y-5">
        {executions.map(sc => (
          <div
            key={sc.id}
            className="rounded-3xl border border-[#e5e5ea] bg-white p-7 sm:p-8 space-y-5 shadow-sm transition-all"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xl font-bold text-[#1d1d1f] tracking-tight">
                  {sc.title}
                </h3>
                <p className="text-sm text-[#6e6e73] mt-0.5">
                  {sc.subtitle}
                </p>
              </div>

              <span className="self-start sm:self-auto text-xs px-3 py-1 rounded-full bg-[#f5f5f7] text-[#1d1d1f] border border-[#e5e5ea] font-medium">
                {sc.badge}
              </span>
            </div>

            <ul className="text-sm text-[#515154] space-y-2.5 pt-4 border-t border-[#e5e5ea] leading-relaxed">
              {sc.story.map((p, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="text-[#86868b] mt-0.5">•</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>

            <div className="pt-2">
              <button
                onClick={() => onRunScenario(sc.id)}
                disabled={isRunningScenario}
                className="py-3 px-5 rounded-xl text-sm font-semibold bg-[#1d1d1f] text-white hover:bg-[#333336] transition-all flex items-center gap-2 disabled:opacity-40 shadow-sm"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>{isRunningScenario ? 'Running Execution...' : 'Run This Execution'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
