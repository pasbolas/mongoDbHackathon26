import React from 'react';
import { Play } from 'lucide-react';

export default function ScenariosView({ onRunScenario, isRunningScenario }) {
  const scenarios = [
    {
      id: 'independent',
      title: 'Scenario 1: Complete Independence',
      subtitle: 'The assistant remains 100% silent throughout the activity.',
      points: [
        'John proceeds through all 6 tea-making steps without deviation.',
        'The system observes John progressing normally and deliberately says nothing.',
        'Success metric: How much the person can continue doing without AI interference.'
      ],
      badge: 'Zero AI Prompts'
    },
    {
      id: 'confusion_mug',
      title: 'Scenario 2: Loop Confusion & Level 1 Nudge',
      subtitle: 'Repeated cupboard opening triggers minimal prompt.',
      points: [
        'John boils water, but opens and closes the cupboard repeatedly looking for his mug.',
        'MongoDB Atlas Vector Search matches similar historical confusion (94% similarity).',
        'AI provides the smallest useful prompt: "Your mug is nearby."',
        'John takes the mug, and the AI immediately returns to silent observation.'
      ],
      badge: 'Atlas Vector Search ($vectorSearch)'
    },
    {
      id: 'escalation',
      title: 'Scenario 3: Progressive Escalation',
      subtitle: 'Persistent hesitation smoothly escalates from subtle nudge to clear cue.',
      points: [
        'John stands still after water boils, exceeding the adaptive hesitation threshold.',
        'AI delivers Level 1 nudge. John remains stuck.',
        'AI escalates to Level 2: "Your mug is in the cupboard beside the kettle."',
        'John follows the cue, and the assistant immediately recedes.'
      ],
      badge: 'Adaptive Escalation'
    }
  ];

  return (
    <div className="space-y-8 max-w-3xl">
      
      {/* Intro Header */}
      <div>
        <h2 className="text-3xl font-semibold tracking-tight text-[#f5f5f7]">
          Demo Scenarios
        </h2>
        <p className="text-base text-[#86868b] mt-1.5 leading-relaxed">
          One-click walkthroughs demonstrating how the assistant intervenes only when necessary.
        </p>
      </div>

      {/* Stacked Scenario Cards (Single-Column - Apple editorial style) */}
      <div className="space-y-5">
        {scenarios.map(sc => (
          <div
            key={sc.id}
            className="rounded-3xl border border-[#242427] bg-[#141416] p-7 sm:p-8 space-y-5 transition-all"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xl font-semibold text-[#f5f5f7] tracking-tight">
                  {sc.title}
                </h3>
                <p className="text-sm text-[#86868b] mt-0.5">
                  {sc.subtitle}
                </p>
              </div>

              <span className="self-start sm:self-auto text-xs px-3 py-1 rounded-full bg-[#1c1c1f] text-[#a1a1a6] border border-[#2c2c30] font-mono">
                {sc.badge}
              </span>
            </div>

            <ul className="text-sm text-[#a1a1a6] space-y-2.5 pt-4 border-t border-[#1f1f23] leading-relaxed">
              {sc.points.map((p, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="text-[#6e6e73] mt-0.5">•</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>

            <div className="pt-2">
              <button
                onClick={() => onRunScenario(sc.id)}
                disabled={isRunningScenario}
                className="py-3 px-5 rounded-xl text-sm font-medium bg-white text-black hover:bg-[#e5e5ea] transition-all flex items-center gap-2 disabled:opacity-40"
              >
                <Play className="w-4 h-4 fill-black" />
                <span>{isRunningScenario ? 'Running Simulation...' : 'Run Demonstration'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
