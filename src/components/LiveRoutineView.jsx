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
    <div className="space-y-8 max-w-3xl">

      {/* 1. Hero Status Card (Apple-Style Big Editorial Typography) */}
      <div className="rounded-3xl border border-[#242427] bg-[#141416] p-8 sm:p-10 transition-all">
        {isFinished ? (
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-emerald-400 text-sm font-semibold uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4" />
              <span>Routine Complete</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#f5f5f7]">
              Tea routine finished.
            </h2>
            <p className="text-base text-[#86868b] leading-relaxed">
              John completed the full activity. Independent completion outcome recorded to MongoDB Atlas to lower future cue levels.
            </p>
          </div>
        ) : isIntervening ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                Prompt Level {state.activePrompt.level} of 3
              </span>
              {soundEnabled && (
                <button
                  onClick={() => speechService.speak(state.activePrompt.text)}
                  className="flex items-center space-x-1.5 text-xs text-[#a1a1a6] hover:text-[#f5f5f7] px-3 py-1 rounded-full border border-[#2c2c30] bg-[#1c1c1e] transition-colors"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Replay Voice</span>
                </button>
              )}
            </div>

            <div className="text-3xl sm:text-4xl font-semibold tracking-tight text-white leading-tight">
              "{state.activePrompt.text}"
            </div>

            <p className="text-sm text-[#86868b]">
              Vector Search matched: {state.activePrompt.vectorMatch?.title || 'Hesitation looking for mug'}.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-emerald-400 text-sm font-semibold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Silence is the Feature</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#f5f5f7]">
              John is on track. AI is quiet.
            </h2>
            <p className="text-base text-[#86868b] leading-relaxed">
              When an individual completes routine steps naturally, the assistant intentionally refrains from intervening to preserve spontaneous memory.
            </p>
          </div>
        )}
      </div>

      {/* 2. Step Stepper (Clean Linear Flow) */}
      <div className="rounded-2xl border border-[#242427] bg-[#141416] p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-medium uppercase tracking-wider text-[#86868b]">
            Step Progress
          </span>
          <span className="text-xs font-medium text-[#f5f5f7]">
            {isFinished ? '6 of 6 Completed' : `Step ${Math.min(6, currentStepIndex + 1)} of 6: ${currentStep?.title || ''}`}
          </span>
        </div>

        {/* Clean pill stepper */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
          {steps.map((s, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex && !isFinished;

            let pillClass = 'bg-[#101012] border-[#1c1c1f] text-[#6e6e73]';
            if (isCurrent) {
              pillClass = 'bg-white text-black font-semibold border-white shadow-sm';
            } else if (isCompleted) {
              pillClass = 'bg-[#1c1c1f] border-[#2c2c30] text-[#f5f5f7]';
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

      {/* 3. Action Workstations (Structured in Clean Vertical Sections - Less Columns) */}
      <div className="space-y-4">
        <div className="text-xs font-medium uppercase tracking-wider text-[#86868b] px-1">
          Simulated Physical Perceptor
        </div>

        {/* Section A: Preparation Actions */}
        <div className="rounded-2xl border border-[#242427] bg-[#141416] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#f5f5f7]">
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
              className="py-3 px-4 rounded-xl text-sm font-medium bg-[#1c1c1e] hover:bg-[#252528] text-[#f5f5f7] border border-[#2c2c30] transition-all flex items-center justify-between disabled:opacity-40"
            >
              <span className="flex items-center gap-2">
                <Droplet className="w-4 h-4 text-cyan-400" />
                <span>Fill Kettle</span>
              </span>
              <span className="text-xs text-[#6e6e73]">
                {sim.kettle?.filled ? 'Filled' : 'Empty'}
              </span>
            </button>

            <button
              onClick={() => onAction('kettle_boil')}
              disabled={isPerformingAction || isFinished}
              className="py-3 px-4 rounded-xl text-sm font-medium bg-[#1c1c1e] hover:bg-[#252528] text-[#f5f5f7] border border-[#2c2c30] transition-all flex items-center justify-between disabled:opacity-40"
            >
              <span className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>Turn On Kettle</span>
              </span>
              <span className="text-xs text-[#6e6e73]">
                {sim.kettle?.boiled ? 'Boiled' : 'Off'}
              </span>
            </button>

            <button
              onClick={() => onAction('take_mug')}
              disabled={isPerformingAction || isFinished}
              className="py-3 px-4 rounded-xl text-sm font-medium bg-[#1c1c1e] hover:bg-[#252528] text-[#f5f5f7] border border-[#2c2c30] transition-all flex items-center justify-between disabled:opacity-40"
            >
              <span className="flex items-center gap-2">
                <Coffee className="w-4 h-4 text-blue-400" />
                <span>Retrieve Blue Mug</span>
              </span>
              <span className="text-xs text-[#6e6e73]">
                {sim.mug?.onCounter ? 'On Counter' : 'In Cupboard'}
              </span>
            </button>

            <button
              onClick={() => onAction('take_teabag')}
              disabled={isPerformingAction || isFinished}
              className="py-3 px-4 rounded-xl text-sm font-medium bg-[#1c1c1e] hover:bg-[#252528] text-[#f5f5f7] border border-[#2c2c30] transition-all flex items-center justify-between disabled:opacity-40"
            >
              <span className="flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-400" />
                <span>Take Tea Bag</span>
              </span>
              <span className="text-xs text-[#6e6e73]">
                {sim.mug?.hasTeabag ? 'Inside Mug' : 'Pantry'}
              </span>
            </button>

            <button
              onClick={() => onAction('pour_water')}
              disabled={isPerformingAction || isFinished}
              className="py-3 px-4 rounded-xl text-sm font-medium bg-[#1c1c1e] hover:bg-[#252528] text-[#f5f5f7] border border-[#2c2c30] transition-all flex items-center justify-between disabled:opacity-40"
            >
              <span className="flex items-center gap-2">
                <Droplet className="w-4 h-4 text-cyan-400" />
                <span>Pour Hot Water</span>
              </span>
              <span className="text-xs text-[#6e6e73]">
                {sim.mug?.hasWater ? 'Poured' : 'Empty'}
              </span>
            </button>

            <button
              onClick={() => onAction('add_milk')}
              disabled={isPerformingAction || isFinished}
              className="py-3 px-4 rounded-xl text-sm font-medium bg-[#1c1c1e] hover:bg-[#252528] text-[#f5f5f7] border border-[#2c2c30] transition-all flex items-center justify-between disabled:opacity-40"
            >
              <span className="flex items-center gap-2">
                <Milk className="w-4 h-4 text-emerald-400" />
                <span>Add Splash of Milk</span>
              </span>
              <span className="text-xs text-[#6e6e73]">
                {sim.mug?.hasMilk ? 'Added' : 'Fridge'}
              </span>
            </button>
          </div>
        </div>

        {/* Section B: Environment Interaction & Hesitation Simulation */}
        <div className="rounded-2xl border border-[#242427] bg-[#141416] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#f5f5f7]">
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
              className="py-2.5 px-3 rounded-xl text-xs font-medium bg-[#1c1c1e] hover:bg-[#252528] text-[#a1a1a6] hover:text-[#f5f5f7] border border-[#2c2c30] transition-colors disabled:opacity-40"
            >
              Open Cupboard
            </button>
            <button
              onClick={() => onAction('cupboard_close')}
              disabled={isPerformingAction || isFinished}
              className="py-2.5 px-3 rounded-xl text-xs font-medium bg-[#1c1c1e] hover:bg-[#252528] text-[#a1a1a6] hover:text-[#f5f5f7] border border-[#2c2c30] transition-colors disabled:opacity-40"
            >
              Close Cupboard
            </button>
            <button
              onClick={() => onIdle(15)}
              disabled={isFinished}
              className="py-2.5 px-3 rounded-xl text-xs font-medium bg-[#1c1c1e] hover:bg-[#252528] text-amber-300 border border-[#2c2c30] transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Simulate 15s Idle</span>
            </button>
          </div>
        </div>

      </div>

      {/* 4. Streamlined Perceived Events Log */}
      {state.actionHistory && state.actionHistory.length > 0 && (
        <div className="rounded-2xl border border-[#242427] bg-[#141416] p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-medium uppercase tracking-wider text-[#86868b]">
              Event Stream (MongoDB `events`)
            </h3>
            <span className="text-xs text-[#6e6e73]">Time-Series</span>
          </div>

          <div className="divide-y divide-[#1f1f23]">
            {state.actionHistory.slice(-4).reverse().map((act, i) => (
              <div key={i} className="py-2 flex items-center justify-between text-xs">
                <span className="font-mono text-[#f5f5f7]">{act.action}</span>
                <span className="text-[#6e6e73]">
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
