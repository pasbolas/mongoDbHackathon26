import React from 'react';
import { Volume2, CheckCircle2, Clock, Droplet, Flame, Coffee, Package, Milk } from 'lucide-react';
import { speechService } from '../utils/speech.js';

export default function LiveRoutineView({ 
  state, 
  onAction, 
  onIdle, 
  isPerformingAction,
  soundEnabled 
}) {
  const currentStep = state.currentStep;
  const currentStepIndex = state.currentStepIndex;
  const isFinished = state.state === 'ROUTINE_COMPLETED';
  const isIntervening = state.state === 'INTERVENING' && state.activePrompt;
  const sim = state.simulation || {};

  const steps = [
    { key: 'fill_kettle', num: 1, title: 'Fill Kettle' },
    { key: 'boil_water', num: 2, title: 'Boil Water' },
    { key: 'get_mug', num: 3, title: 'Get Mug' },
    { key: 'get_teabag', num: 4, title: 'Get Tea Bag' },
    { key: 'pour_water', num: 5, title: 'Pour Water' },
    { key: 'add_milk', num: 6, title: 'Add Milk' }
  ];

  return (
    <div className="space-y-8 max-w-3xl font-mono">

      {/* 1. Hero Status Card */}
      <div className="rounded-3xl border border-[#e5e5ea] bg-white p-8 sm:p-10 shadow-sm transition-all">
        {isFinished ? (
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-emerald-700 text-xs font-bold uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4" />
              <span>Routine Complete</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1d1d1f]">
              Tea routine finished.
            </h2>
            <p className="text-base text-[#6e6e73] leading-relaxed">
              John completed the full activity. Independent completion outcome recorded to MongoDB Atlas to lower future cue levels.
            </p>
          </div>
        ) : isIntervening ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#fef3c7] text-[#92400e] border border-[#fcd34d]">
                Prompt Level {state.activePrompt.level} of 3
              </span>
              {soundEnabled && (
                <button
                  onClick={() => speechService.speak(state.activePrompt.text)}
                  className="flex items-center space-x-1.5 text-xs text-[#1d1d1f] hover:bg-[#f5f5f7] px-3 py-1 rounded-full border border-[#d1d1d6] bg-white transition-colors"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Replay Voice</span>
                </button>
              )}
            </div>

            <div className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1d1d1f] leading-tight">
              "{state.activePrompt.text}"
            </div>

            <p className="text-sm text-[#6e6e73]">
              Vector Search matched: {state.activePrompt.vectorMatch?.title || 'Hesitation looking for mug'}.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-emerald-700 text-xs font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              <span>Silence is the Feature</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1d1d1f]">
              John is on track. AI is quiet.
            </h2>
            <p className="text-base text-[#6e6e73] leading-relaxed">
              When an individual completes routine steps naturally, the assistant intentionally refrains from intervening to preserve spontaneous memory.
            </p>
          </div>
        )}
      </div>

      {/* 2. Step Stepper (Clean Linear Flow) */}
      <div className="rounded-2xl border border-[#e5e5ea] bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#86868b]">
            Step Progress
          </span>
          <span className="text-xs font-medium text-[#1d1d1f]">
            {isFinished ? '6 of 6 Completed' : `Step ${Math.min(6, currentStepIndex + 1)} of 6: ${currentStep?.title || ''}`}
          </span>
        </div>

        {/* Clean pill stepper */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
          {steps.map((s, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex && !isFinished;

            let pillClass = 'bg-[#fbfbfd] border-[#e5e5ea] text-[#86868b]';
            if (isCurrent) {
              pillClass = 'bg-[#1d1d1f] text-white font-bold border-[#1d1d1f] shadow-sm';
            } else if (isCompleted) {
              pillClass = 'bg-[#f5f5f7] border-[#d1d1d6] text-[#1d1d1f]';
            }

            return (
              <div
                key={s.key}
                className={`py-2 px-3 rounded-xl border text-center transition-all ${pillClass}`}
              >
                <div className="text-[10px] font-medium opacity-70">0{s.num}</div>
                <div className="text-xs truncate font-medium">{s.title}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Action Workstations */}
      <div className="space-y-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-[#86868b] px-1">
          Simulated Physical Perceptor
        </div>

        {/* Section A: Primary Actions */}
        <div className="rounded-2xl border border-[#e5e5ea] bg-white p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#1d1d1f]">
              Primary Routine Actions
            </h3>
            <span className="text-xs text-[#86868b]">
              Simulates camera perception
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => onAction('kettle_fill')}
              disabled={isPerformingAction || isFinished}
              className="py-3 px-4 rounded-xl text-sm font-medium bg-white hover:bg-[#f5f5f7] text-[#1d1d1f] border border-[#d1d1d6] transition-all flex items-center justify-between disabled:opacity-40 shadow-sm"
            >
              <span className="flex items-center gap-2">
                <Droplet className="w-4 h-4 text-cyan-600" />
                <span>Fill Kettle</span>
              </span>
              <span className="text-xs text-[#86868b]">
                {sim.kettle?.filled ? 'Filled' : 'Empty'}
              </span>
            </button>

            <button
              onClick={() => onAction('kettle_boil')}
              disabled={isPerformingAction || isFinished}
              className="py-3 px-4 rounded-xl text-sm font-medium bg-white hover:bg-[#f5f5f7] text-[#1d1d1f] border border-[#d1d1d6] transition-all flex items-center justify-between disabled:opacity-40 shadow-sm"
            >
              <span className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-600" />
                <span>Turn On Kettle</span>
              </span>
              <span className="text-xs text-[#86868b]">
                {sim.kettle?.boiled ? 'Boiled' : 'Off'}
              </span>
            </button>

            <button
              onClick={() => onAction('take_mug')}
              disabled={isPerformingAction || isFinished}
              className="py-3 px-4 rounded-xl text-sm font-medium bg-white hover:bg-[#f5f5f7] text-[#1d1d1f] border border-[#d1d1d6] transition-all flex items-center justify-between disabled:opacity-40 shadow-sm"
            >
              <span className="flex items-center gap-2">
                <Coffee className="w-4 h-4 text-blue-600" />
                <span>Retrieve Blue Mug</span>
              </span>
              <span className="text-xs text-[#86868b]">
                {sim.mug?.onCounter ? 'On Counter' : 'In Cupboard'}
              </span>
            </button>

            <button
              onClick={() => onAction('take_teabag')}
              disabled={isPerformingAction || isFinished}
              className="py-3 px-4 rounded-xl text-sm font-medium bg-white hover:bg-[#f5f5f7] text-[#1d1d1f] border border-[#d1d1d6] transition-all flex items-center justify-between disabled:opacity-40 shadow-sm"
            >
              <span className="flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-600" />
                <span>Take Tea Bag</span>
              </span>
              <span className="text-xs text-[#86868b]">
                {sim.mug?.hasTeabag ? 'Inside Mug' : 'Pantry'}
              </span>
            </button>

            <button
              onClick={() => onAction('pour_water')}
              disabled={isPerformingAction || isFinished}
              className="py-3 px-4 rounded-xl text-sm font-medium bg-white hover:bg-[#f5f5f7] text-[#1d1d1f] border border-[#d1d1d6] transition-all flex items-center justify-between disabled:opacity-40 shadow-sm"
            >
              <span className="flex items-center gap-2">
                <Droplet className="w-4 h-4 text-cyan-600" />
                <span>Pour Hot Water</span>
              </span>
              <span className="text-xs text-[#86868b]">
                {sim.mug?.hasWater ? 'Poured' : 'Empty'}
              </span>
            </button>

            <button
              onClick={() => onAction('add_milk')}
              disabled={isPerformingAction || isFinished}
              className="py-3 px-4 rounded-xl text-sm font-medium bg-white hover:bg-[#f5f5f7] text-[#1d1d1f] border border-[#d1d1d6] transition-all flex items-center justify-between disabled:opacity-40 shadow-sm"
            >
              <span className="flex items-center gap-2">
                <Milk className="w-4 h-4 text-emerald-600" />
                <span>Add Splash of Milk</span>
              </span>
              <span className="text-xs text-[#86868b]">
                {sim.mug?.hasMilk ? 'Added' : 'Fridge'}
              </span>
            </button>
          </div>
        </div>

        {/* Section B: Environment Interaction */}
        <div className="rounded-2xl border border-[#e5e5ea] bg-white p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#1d1d1f]">
              Environmental Actions & Hesitation
            </h3>
            <span className="text-xs text-[#86868b]">
              Test edge cases & loop detection
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => onAction('cupboard_open')}
              disabled={isPerformingAction || isFinished}
              className="py-2.5 px-3 rounded-xl text-xs font-medium bg-white hover:bg-[#f5f5f7] text-[#1d1d1f] border border-[#d1d1d6] transition-colors disabled:opacity-40 shadow-sm"
            >
              Open Cupboard
            </button>
            <button
              onClick={() => onAction('cupboard_close')}
              disabled={isPerformingAction || isFinished}
              className="py-2.5 px-3 rounded-xl text-xs font-medium bg-white hover:bg-[#f5f5f7] text-[#1d1d1f] border border-[#d1d1d6] transition-colors disabled:opacity-40 shadow-sm"
            >
              Close Cupboard
            </button>
            <button
              onClick={() => onIdle(15)}
              disabled={isFinished}
              className="py-2.5 px-3 rounded-xl text-xs font-medium bg-[#fffbeb] hover:bg-[#fef3c7] text-[#92400e] border border-[#fde68a] transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Simulate 15s Idle</span>
            </button>
          </div>
        </div>

      </div>

      {/* 4. Streamlined Perceived Events Log */}
      {state.actionHistory && state.actionHistory.length > 0 && (
        <div className="rounded-2xl border border-[#e5e5ea] bg-white p-6 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#86868b]">
              Event Stream (MongoDB `events`)
            </h3>
            <span className="text-xs text-[#86868b]">Time-Series</span>
          </div>

          <div className="divide-y divide-[#e5e5ea]">
            {state.actionHistory.slice(-4).reverse().map((act, i) => (
              <div key={i} className="py-2 flex items-center justify-between text-xs">
                <span className="font-mono font-medium text-[#1d1d1f]">{act.action}</span>
                <span className="text-[#86868b]">
                  {new Date(act.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
