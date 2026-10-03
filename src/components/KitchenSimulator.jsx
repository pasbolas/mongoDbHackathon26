import React from 'react';
import { 
  Flame, 
  Droplet, 
  Coffee, 
  Clock, 
  Layers, 
  Check, 
  AlertTriangle,
  Sparkles,
  ArrowRight,
  DoorOpen,
  DoorClosed,
  Milk,
  Package
} from 'lucide-react';

export default function KitchenSimulator({ 
  state, 
  onAction, 
  onIdle, 
  isPerformingAction 
}) {
  const currentStep = state.currentStep;
  const currentStepIndex = state.currentStepIndex;
  const sim = state.simulation || {};
  const isFinished = state.state === 'ROUTINE_COMPLETED';

  const stepsList = [
    { key: 'fill_kettle', num: 1, label: 'Fill Kettle', target: 'kettle_fill' },
    { key: 'boil_water', num: 2, label: 'Boil Water', target: 'kettle_boil' },
    { key: 'get_mug', num: 3, label: 'Get Mug', target: 'take_mug' },
    { key: 'get_teabag', num: 4, label: 'Get Tea Bag', target: 'take_teabag' },
    { key: 'pour_water', num: 5, label: 'Pour Water', target: 'pour_water' },
    { key: 'add_milk', num: 6, label: 'Add Milk', target: 'add_milk' }
  ];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
      
      {/* Title & Activity Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <h2 className="text-base font-bold text-white tracking-wide">
              Kitchen Physical Environment (Simulated Camera Perception)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Observing John's natural routine in real-time. Actions simulate computer-vision events.
          </p>
        </div>

        {/* Status pill */}
        <div className="flex items-center space-x-2">
          {isFinished ? (
            <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <Check className="w-3.5 h-3.5" />
              <span>Tea Routine Completed!</span>
            </span>
          ) : (
            <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>Step {Math.min(6, currentStepIndex + 1)} of 6: </span>
              <strong className="text-emerald-400">{currentStep ? currentStep.title : 'Done'}</strong>
            </span>
          )}
        </div>
      </div>

      {/* Routine Progress Timeline */}
      <div className="py-4 border-b border-slate-800/80">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {stepsList.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex && !isFinished;
            const outcome = state.stepOutcomes?.find(o => o.stepKey === step.key);
            const wasIndependent = outcome ? outcome.wasIndependent : true;

            let bgColor = 'bg-slate-950/60 border-slate-800 text-slate-500';
            if (isCurrent) {
              bgColor = 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300 shadow-sm shadow-emerald-500/10';
            } else if (isCompleted) {
              bgColor = wasIndependent
                ? 'bg-emerald-900/20 border-emerald-600/30 text-emerald-400'
                : 'bg-indigo-900/20 border-indigo-500/30 text-indigo-300';
            }

            return (
              <div 
                key={step.key}
                className={`p-2.5 rounded-xl border flex flex-col justify-between transition-all ${bgColor}`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                  <span>#{step.num}</span>
                  {isCompleted && (
                    <span className="text-[10px] font-semibold">
                      {wasIndependent ? '✓ Solo' : '⚡ Cue'}
                    </span>
                  )}
                  {isCurrent && <span className="text-[10px] text-emerald-400 animate-pulse">Active</span>}
                </div>
                <div className="text-xs font-semibold truncate">{step.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Physical Kitchen Workstations Visual Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-5">

        {/* Station 1: Kettle & Sink */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Droplet className="w-4 h-4 text-cyan-400" />
                Sink & Kettle Base
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-slate-800 text-slate-400">
                {sim.kettle?.boiled ? 'Boiled 🔥' : sim.kettle?.filled ? 'Water Filled' : 'Empty'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mb-4">
              Tap water supply and electric rapid boil kettle.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => onAction('kettle_fill')}
              disabled={isPerformingAction || isFinished}
              className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] disabled:opacity-40"
            >
              <Droplet className="w-3.5 h-3.5 text-cyan-400" />
              <span>Fill Kettle with Tap Water</span>
            </button>
            <button
              onClick={() => onAction('kettle_boil')}
              disabled={isPerformingAction || isFinished}
              className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-amber-950/30 hover:bg-amber-900/40 border border-amber-600/30 text-amber-200 flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] disabled:opacity-40"
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Turn On Kettle (Boil)</span>
            </button>
          </div>
        </div>

        {/* Station 2: Cupboards & Mug */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Coffee className="w-4 h-4 text-blue-400" />
                Upper Cupboard
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-slate-800 text-slate-400">
                {sim.cupboard?.open ? 'Door Open 🚪' : 'Closed'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mb-4">
              Where John usually keeps his favorite blue ceramic tea mug.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onAction('cupboard_open')}
                disabled={isPerformingAction || isFinished}
                className="py-2 px-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 flex items-center justify-center gap-1 transition-all active:scale-[0.98] disabled:opacity-40"
              >
                <DoorOpen className="w-3 h-3 text-slate-400" />
                <span>Open Door</span>
              </button>
              <button
                onClick={() => onAction('cupboard_close')}
                disabled={isPerformingAction || isFinished}
                className="py-2 px-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 flex items-center justify-center gap-1 transition-all active:scale-[0.98] disabled:opacity-40"
              >
                <DoorClosed className="w-3 h-3 text-slate-400" />
                <span>Close Door</span>
              </button>
            </div>
            <button
              onClick={() => onAction('take_mug')}
              disabled={isPerformingAction || isFinished}
              className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-blue-950/30 hover:bg-blue-900/40 border border-blue-500/30 text-blue-200 flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] disabled:opacity-40"
            >
              <Coffee className="w-3.5 h-3.5 text-blue-400" />
              <span>Retrieve Blue Mug</span>
            </button>
          </div>
        </div>

        {/* Station 3: Pantry & Fridge */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Milk className="w-4 h-4 text-emerald-400" />
                Pantry & Fridge
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-slate-800 text-slate-400">
                {sim.mug?.hasMilk ? 'Milk Added 🥛' : sim.mug?.hasTeabag ? 'Tea Bag Placed' : 'Pantry Ready'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mb-4">
              Earl Grey tea box on the shelf and fresh milk in the fridge.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => onAction('take_teabag')}
              disabled={isPerformingAction || isFinished}
              className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] disabled:opacity-40"
            >
              <Package className="w-3.5 h-3.5 text-amber-400" />
              <span>Take Earl Grey Tea Bag</span>
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onAction('pour_water')}
                disabled={isPerformingAction || isFinished}
                className="py-2 px-2 rounded-lg text-xs font-semibold bg-cyan-950/30 hover:bg-cyan-900/40 border border-cyan-600/30 text-cyan-200 flex items-center justify-center gap-1 transition-all active:scale-[0.98] disabled:opacity-40"
              >
                <Droplet className="w-3 h-3 text-cyan-400" />
                <span>Pour Water</span>
              </button>
              <button
                onClick={() => onAction('add_milk')}
                disabled={isPerformingAction || isFinished}
                className="py-2 px-2 rounded-lg text-xs font-semibold bg-emerald-950/30 hover:bg-emerald-900/40 border border-emerald-600/30 text-emerald-200 flex items-center justify-center gap-1 transition-all active:scale-[0.98] disabled:opacity-40"
              >
                <Milk className="w-3 h-3 text-emerald-400" />
                <span>Add Milk</span>
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Manual Hesitation Simulator */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 gap-3">
        <div className="flex items-center space-x-2 text-xs text-slate-400">
          <Clock className="w-4 h-4 text-amber-400" />
          <span>Simulate cognitive pause or confusion hesitation:</span>
          {state.idleSeconds > 0 && (
            <span className="font-mono text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded">
              +{state.idleSeconds}s elapsed
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onIdle(5)}
            disabled={isFinished}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-medium border border-slate-700 transition-all active:scale-95 disabled:opacity-40"
          >
            +5s Idle
          </button>
          <button
            onClick={() => onIdle(15)}
            disabled={isFinished}
            className="px-3 py-1.5 rounded-lg bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 text-xs font-semibold border border-amber-500/30 transition-all active:scale-95 disabled:opacity-40 flex items-center gap-1"
          >
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            <span>Simulate +15s Hesitation</span>
          </button>
        </div>
      </div>

    </div>
  );
}
