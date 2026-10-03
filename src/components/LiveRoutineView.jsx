import React from 'react';
import { Volume2, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
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
    { key: 'fill_kettle', num: 1, title: 'Fill Kettle', targetAction: 'kettle_fill' },
    { key: 'boil_water', num: 2, title: 'Boil Water', targetAction: 'kettle_boil' },
    { key: 'get_mug', num: 3, title: 'Get Mug', targetAction: 'take_mug' },
    { key: 'get_teabag', num: 4, title: 'Get Tea Bag', targetAction: 'take_teabag' },
    { key: 'pour_water', num: 5, title: 'Pour Water', targetAction: 'pour_water' },
    { key: 'add_milk', num: 6, title: 'Add Milk', targetAction: 'add_milk' }
  ];

  return (
    <div className="space-y-6">

      {/* 1. Main Status & Voice Prompt Banner */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
        {isFinished ? (
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-emerald-400 font-semibold text-xl">
              <CheckCircle2 className="w-6 h-6" />
              <span>Routine Finished</span>
            </div>
            <p className="text-base text-neutral-300">
              John completed the entire tea making sequence.
            </p>
          </div>
        ) : isIntervening ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded border border-amber-400/20">
                AI Assistance: Level {state.activePrompt.level} Prompt
              </span>
              {soundEnabled && (
                <button
                  onClick={() => speechService.speak(state.activePrompt.text)}
                  className="flex items-center space-x-1.5 text-xs text-neutral-300 hover:text-white px-2.5 py-1 rounded border border-neutral-700 bg-neutral-800"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Replay Voice</span>
                </button>
              )}
            </div>

            {/* Large Spoken Prompt */}
            <div className="text-2xl font-semibold text-white">
              "{state.activePrompt.text}"
            </div>

            <p className="text-sm text-neutral-400">
              Matched situation in MongoDB: {state.activePrompt.vectorMatch?.title || 'Hesitation looking for item'}.
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2 text-emerald-400 font-semibold text-lg">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <span>AI is Silent</span>
            </div>
            <p className="text-xl font-medium text-white">
              John is making tea normally. No assistance needed.
            </p>
            <p className="text-sm text-neutral-400">
              The system intentionally does nothing to promote independent memory.
            </p>
          </div>
        )}
      </div>

      {/* 2. Step Sequence Checklist */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
        <h2 className="text-base font-semibold text-neutral-300 mb-4">
          Routine Sequence
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {steps.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex && !isFinished;

            let cardStyle = 'border-neutral-800 bg-neutral-950 text-neutral-500';
            if (isCurrent) {
              cardStyle = 'border-neutral-600 bg-neutral-800 text-white font-semibold';
            } else if (isCompleted) {
              cardStyle = 'border-neutral-800 bg-neutral-950 text-neutral-300';
            }

            return (
              <div
                key={step.key}
                className={`p-3.5 rounded-lg border flex flex-col justify-between ${cardStyle}`}
              >
                <div className="flex items-center justify-between text-xs mb-2">
                  <span>Step {step.num}</span>
                  {isCompleted && <span className="text-emerald-400 font-bold">✓ Done</span>}
                  {isCurrent && <span className="text-amber-400">Now</span>}
                </div>
                <div className="text-sm font-medium">{step.title}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Action Simulator */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 space-y-6">
        <div>
          <h2 className="text-base font-semibold text-neutral-200">
            Simulate Perceived Actions
          </h2>
          <p className="text-sm text-neutral-400 mt-0.5">
            Click an action below to simulate what the camera or sensors perceive.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Station 1: Kettle */}
          <div className="space-y-3">
            <div className="text-sm font-medium text-neutral-400">
              1. Water & Kettle
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => onAction('kettle_fill')}
                disabled={isPerformingAction || isFinished}
                className="w-full py-2.5 px-4 rounded-lg text-sm font-medium bg-neutral-800 hover:bg-neutral-750 text-white border border-neutral-700 disabled:opacity-40 transition-colors"
              >
                Fill Kettle at Sink
              </button>
              <button
                onClick={() => onAction('kettle_boil')}
                disabled={isPerformingAction || isFinished}
                className="w-full py-2.5 px-4 rounded-lg text-sm font-medium bg-neutral-800 hover:bg-neutral-750 text-white border border-neutral-700 disabled:opacity-40 transition-colors"
              >
                Turn On Kettle (Boil)
              </button>
            </div>
            <div className="text-xs text-neutral-500">
              Status: {sim.kettle?.boiled ? 'Water Boiled' : sim.kettle?.filled ? 'Filled' : 'Empty'}
            </div>
          </div>

          {/* Station 2: Cupboard & Mug */}
          <div className="space-y-3">
            <div className="text-sm font-medium text-neutral-400">
              2. Cupboard & Mug
            </div>
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onAction('cupboard_open')}
                  disabled={isPerformingAction || isFinished}
                  className="py-2.5 px-3 rounded-lg text-sm font-medium bg-neutral-800 hover:bg-neutral-750 text-white border border-neutral-700 disabled:opacity-40 transition-colors"
                >
                  Open Cupboard
                </button>
                <button
                  onClick={() => onAction('cupboard_close')}
                  disabled={isPerformingAction || isFinished}
                  className="py-2.5 px-3 rounded-lg text-sm font-medium bg-neutral-800 hover:bg-neutral-750 text-white border border-neutral-700 disabled:opacity-40 transition-colors"
                >
                  Close Cupboard
                </button>
              </div>
              <button
                onClick={() => onAction('take_mug')}
                disabled={isPerformingAction || isFinished}
                className="w-full py-2.5 px-4 rounded-lg text-sm font-medium bg-neutral-800 hover:bg-neutral-750 text-white border border-neutral-700 disabled:opacity-40 transition-colors"
              >
                Retrieve Blue Mug
              </button>
            </div>
            <div className="text-xs text-neutral-500">
              Status: {sim.cupboard?.open ? 'Cupboard Open' : 'Cupboard Closed'}
            </div>
          </div>

          {/* Station 3: Tea & Milk */}
          <div className="space-y-3">
            <div className="text-sm font-medium text-neutral-400">
              3. Tea & Milk
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => onAction('take_teabag')}
                disabled={isPerformingAction || isFinished}
                className="w-full py-2.5 px-4 rounded-lg text-sm font-medium bg-neutral-800 hover:bg-neutral-750 text-white border border-neutral-700 disabled:opacity-40 transition-colors"
              >
                Take Tea Bag
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onAction('pour_water')}
                  disabled={isPerformingAction || isFinished}
                  className="py-2.5 px-3 rounded-lg text-sm font-medium bg-neutral-800 hover:bg-neutral-750 text-white border border-neutral-700 disabled:opacity-40 transition-colors"
                >
                  Pour Water
                </button>
                <button
                  onClick={() => onAction('add_milk')}
                  disabled={isPerformingAction || isFinished}
                  className="py-2.5 px-3 rounded-lg text-sm font-medium bg-neutral-800 hover:bg-neutral-750 text-white border border-neutral-700 disabled:opacity-40 transition-colors"
                >
                  Add Milk
                </button>
              </div>
            </div>
            <div className="text-xs text-neutral-500">
              Status: {sim.mug?.hasMilk ? 'Milk added' : sim.mug?.hasWater ? 'Water poured' : sim.mug?.hasTeabag ? 'Teabag ready' : 'Empty'}
            </div>
          </div>

        </div>

        {/* Hesitation trigger */}
        <div className="pt-4 border-t border-neutral-800 flex items-center justify-between">
          <div className="text-sm text-neutral-400 flex items-center gap-2">
            <Clock className="w-4 h-4 text-neutral-500" />
            <span>Simulate confusion hesitation:</span>
            {state.idleSeconds > 0 && (
              <span className="font-mono text-amber-400 font-semibold">
                +{state.idleSeconds}s idle
              </span>
            )}
          </div>
          <button
            onClick={() => onIdle(15)}
            disabled={isFinished}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-neutral-800 hover:bg-neutral-750 text-amber-300 border border-neutral-700 disabled:opacity-40 transition-colors"
          >
            +15 Seconds Idle
          </button>
        </div>

      </div>

      {/* 4. Simple Perception Log */}
      {state.actionHistory && state.actionHistory.length > 0 && (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
          <h3 className="text-sm font-medium text-neutral-400 mb-3">
            Recent Perceived Events
          </h3>
          <div className="space-y-2">
            {state.actionHistory.slice(-4).reverse().map((act, i) => (
              <div key={i} className="flex items-center justify-between text-sm py-1.5 px-3 rounded bg-neutral-950 border border-neutral-850">
                <span className="font-mono text-neutral-200">{act.action}</span>
                <span className="text-xs text-neutral-500">
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
