import React from 'react';
import { Play, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

export default function ScenariosView({ onRunScenario, isRunningScenario }) {
  const scenarios = [
    {
      id: 'independent',
      title: 'Scenario 1: Full Independence',
      subtitle: 'The AI stays completely silent',
      details: [
        'John executes each step (Fill → Boil → Mug → Teabag → Pour → Milk) independently.',
        'The system observes John progressing normally and deliberately says nothing.',
        'Success metric: How much the person can continue doing without AI.'
      ],
      tag: 'Zero Prompts'
    },
    {
      id: 'confusion_mug',
      title: 'Scenario 2: Loop Confusion',
      subtitle: 'Cupboard checking triggers minimal Level 1 cue',
      details: [
        'John boils water, but opens and closes the cupboard repeatedly without taking the mug.',
        'MongoDB Atlas Vector Search matches similar historical confusion (94% match).',
        'AI provides the smallest useful prompt: "Your mug is nearby."',
        'John takes the mug, and the AI immediately recedes.'
      ],
      tag: 'Vector Search + Level 1 Nudge'
    },
    {
      id: 'escalation',
      title: 'Scenario 3: Multi-Level Escalation',
      subtitle: 'Persistent hesitation causes gradual escalation',
      details: [
        'John stands still after water boils. Exceeds the adaptive hesitation threshold.',
        'AI delivers Level 1 nudge. John remains stuck.',
        'AI escalates to Level 2: "Your mug is in the cupboard beside the kettle."',
        'John follows the cue, and the AI immediately returns to silence.'
      ],
      tag: 'Adaptive Escalation'
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Intro */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
        <h2 className="text-xl font-bold text-white mb-1">
          Automated Demo Scenarios
        </h2>
        <p className="text-base text-neutral-400">
          Click any scenario below to observe how the assistant adapts its intervention.
        </p>
      </div>

      {/* 3 Large Scenario Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {scenarios.map(sc => (
          <div
            key={sc.id}
            className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 flex flex-col justify-between space-y-5"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-400 bg-neutral-800 px-2.5 py-1 rounded border border-neutral-700">
                  {sc.tag}
                </span>
              </div>

              <h3 className="text-lg font-bold text-white">
                {sc.title}
              </h3>
              
              <p className="text-sm font-medium text-emerald-400">
                {sc.subtitle}
              </p>

              <ul className="text-sm text-neutral-400 space-y-2 pt-2 border-t border-neutral-800">
                {sc.details.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-neutral-600 mt-1">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => onRunScenario(sc.id)}
              disabled={isRunningScenario}
              className="w-full py-3 px-4 rounded-lg text-sm font-semibold bg-white text-neutral-900 hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{isRunningScenario ? 'Running...' : 'Run Scenario'}</span>
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}
