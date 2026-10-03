import React from 'react';
import { Volume2, CheckCircle2, Clock, Briefcase, CreditCard, Key, Smartphone, BookOpen, Droplet, ShieldCheck } from 'lucide-react';
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
  const isFinished = state.state === 'TASK_COMPLETED';
  const isIntervening = state.state === 'INTERVENING' && state.activePrompt;
  const isWaiting = state.state === 'WAITING';
  const sim = state.simulation || {};

  const steps = [
    { key: 'open_bag', num: 1, title: 'Open Bag', icon: Briefcase },
    { key: 'pack_wallet', num: 2, title: 'Wallet', icon: CreditCard },
    { key: 'pack_keys', num: 3, title: 'Keys', icon: Key },
    { key: 'pack_phone', num: 4, title: 'Phone', icon: Smartphone },
    { key: 'pack_notebook', num: 5, title: 'Notebook', icon: BookOpen },
    { key: 'pack_water', num: 6, title: 'Water', icon: Droplet },
    { key: 'close_bag', num: 7, title: 'Close Bag', icon: Briefcase }
  ];

  return (
    <div className="space-y-8 max-w-3xl font-mono">

      {/* 1. Hero Status Card */}
      <div className="rounded-3xl border border-[#e5e5ea] bg-white p-8 sm:p-10 shadow-sm transition-all">
        {isFinished ? (
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-emerald-700 text-xs font-bold uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4" />
              <span>Activity Complete</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1d1d1f]">
              Sarah's bag is packed.
            </h2>
            <p className="text-base text-[#6e6e73] leading-relaxed">
              All essential items packed. Longitudinal episode outcome stored in MongoDB Atlas to calibrate future assistance.
            </p>
          </div>
        ) : isIntervening ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#fef3c7] text-[#92400e] border border-[#fcd34d]">
                Task Uncertainty: {state.activePrompt.type === 'subtle_verbal' ? 'Subtle Cue' : 'Clearer Cue'}
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
              Atlas Vector Search matched: {state.activePrompt.vectorMatch?.title || 'Episode #17 (Inactivity after phone/wallet/keys)'}.
            </p>
          </div>
        ) : isWaiting ? (
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-amber-700 text-xs font-bold uppercase tracking-wider">
              <Clock className="w-4 h-4" />
              <span>Observing & Waiting</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1d1d1f]">
              Inactivity detected. Anchor waits.
            </h2>
            <p className="text-base text-[#6e6e73] leading-relaxed">
              Anchor does not rush to prompt. It waits to give Sarah space to self-initiate before considering an intervention.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-emerald-700 text-xs font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              <span>Silence is the Goal</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1d1d1f]">
              Sarah is packing normally. Anchor is quiet.
            </h2>
            <p className="text-base text-[#6e6e73] leading-relaxed">
              Anchor learns when NOT to intervene. Providing the minimum useful assistance while preserving as much independent action as possible.
            </p>
          </div>
        )}
      </div>

      {/* 2. Step Progress Flow */}
      <div className="rounded-2xl border border-[#e5e5ea] bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#86868b]">
            Packing Sequence
          </span>
          <span className="text-xs font-medium text-[#1d1d1f]">
            {isFinished ? '7 of 7 Done' : `Step ${Math.min(7, currentStepIndex + 1)} of 7: ${currentStep?.title || ''}`}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-7 gap-2">
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
                className={`py-2 px-2 rounded-xl border text-center transition-all ${pillClass}`}
              >
                <div className="text-[10px] font-medium opacity-70">0{s.num}</div>
                <div className="text-[11px] truncate font-medium mt-0.5">{s.title}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Physical Perception Actions */}
      <div className="space-y-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-[#86868b] px-1">
          Simulated Edge Perception (Local Processing)
        </div>

        <div className="rounded-2xl border border-[#e5e5ea] bg-white p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#1d1d1f]">
              Object Interactions
            </h3>
            <span className="text-xs text-[#86868b]">
              Frames discarded immediately
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => onAction('bag_open')}
              disabled={isPerformingAction || isFinished}
              className="py-3 px-4 rounded-xl text-sm font-medium bg-white hover:bg-[#f5f5f7] text-[#1d1d1f] border border-[#d1d1d6] transition-all flex items-center justify-between disabled:opacity-40 shadow-sm"
            >
              <span className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-neutral-600" />
                <span>Open Bag</span>
              </span>
              <span className="text-xs text-[#86868b]">
                {sim.bag?.open ? 'Open' : 'Closed'}
              </span>
            </button>

            <button
              onClick={() => onAction('wallet_added')}
              disabled={isPerformingAction || isFinished}
              className="py-3 px-4 rounded-xl text-sm font-medium bg-white hover:bg-[#f5f5f7] text-[#1d1d1f] border border-[#d1d1d6] transition-all flex items-center justify-between disabled:opacity-40 shadow-sm"
            >
              <span className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>Pack Wallet</span>
              </span>
              <span className="text-xs text-[#86868b]">
                {sim.items?.wallet?.packed ? 'In Bag' : 'Desk'}
              </span>
            </button>

            <button
              onClick={() => onAction('keys_added')}
              disabled={isPerformingAction || isFinished}
              className="py-3 px-4 rounded-xl text-sm font-medium bg-white hover:bg-[#f5f5f7] text-[#1d1d1f] border border-[#d1d1d6] transition-all flex items-center justify-between disabled:opacity-40 shadow-sm"
            >
              <span className="flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-600" />
                <span>Pack Keys</span>
              </span>
              <span className="text-xs text-[#86868b]">
                {sim.items?.keys?.packed ? 'In Bag' : 'Desk'}
              </span>
            </button>

            <button
              onClick={() => onAction('phone_added')}
              disabled={isPerformingAction || isFinished}
              className="py-3 px-4 rounded-xl text-sm font-medium bg-white hover:bg-[#f5f5f7] text-[#1d1d1f] border border-[#d1d1d6] transition-all flex items-center justify-between disabled:opacity-40 shadow-sm"
            >
              <span className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-blue-600" />
                <span>Pack Phone</span>
              </span>
              <span className="text-xs text-[#86868b]">
                {sim.items?.phone?.packed ? 'In Bag' : 'Desk'}
              </span>
            </button>

            <button
              onClick={() => onAction('notebook_added')}
              disabled={isPerformingAction || isFinished}
              className="py-3 px-4 rounded-xl text-sm font-medium bg-white hover:bg-[#f5f5f7] text-[#1d1d1f] border border-[#d1d1d6] transition-all flex items-center justify-between disabled:opacity-40 shadow-sm"
            >
              <span className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span>Pack Notebook</span>
              </span>
              <span className="text-xs text-[#86868b]">
                {sim.items?.notebook?.packed ? 'In Bag' : 'Desk'}
              </span>
            </button>

            <button
              onClick={() => onAction('water_added')}
              disabled={isPerformingAction || isFinished}
              className="py-3 px-4 rounded-xl text-sm font-medium bg-white hover:bg-[#f5f5f7] text-[#1d1d1f] border border-[#d1d1d6] transition-all flex items-center justify-between disabled:opacity-40 shadow-sm"
            >
              <span className="flex items-center gap-2">
                <Droplet className="w-4 h-4 text-cyan-600" />
                <span>Pack Water Bottle</span>
              </span>
              <span className="text-xs text-[#86868b]">
                {sim.items?.water_bottle?.packed ? 'In Bag' : 'Counter'}
              </span>
            </button>
          </div>

          <div className="pt-2">
            <button
              onClick={() => onAction('bag_close')}
              disabled={isPerformingAction || isFinished}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-[#f5f5f7] hover:bg-[#eaeaea] text-[#1d1d1f] border border-[#d1d1d6] transition-all disabled:opacity-40"
            >
              Close Bag (Finish Packing)
            </button>
          </div>
        </div>

        {/* Section B: Inactivity & Pause Simulation */}
        <div className="rounded-2xl border border-[#e5e5ea] bg-white p-6 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#1d1d1f]">
                Simulate Inactivity / Cognitive Pause
              </h3>
              <p className="text-xs text-[#6e6e73] mt-0.5">
                Anchor first enters WAIT. Prompts only if uncertainty persists.
              </p>
            </div>
            <button
              onClick={() => onIdle(15)}
              disabled={isFinished}
              className="py-2.5 px-4 rounded-xl text-xs font-medium bg-[#fffbeb] hover:bg-[#fef3c7] text-[#92400e] border border-[#fde68a] transition-colors flex items-center gap-1.5 disabled:opacity-40"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Simulate 15s Pause {state.idleSeconds > 0 ? `(+${state.idleSeconds}s)` : ''}</span>
            </button>
          </div>
        </div>

      </div>

      {/* 4. Privacy Guarantee Card */}
      <div className="rounded-2xl border border-[#e5e5ea] bg-[#fbfbfd] p-5 flex items-start gap-3 text-xs text-[#6e6e73]">
        <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-[#1d1d1f]">Privacy Architecture:</strong> Raw webcam frames are processed strictly in local memory and discarded immediately. Only high-level semantic event records (e.g., <code className="text-[#1d1d1f] bg-[#eaeaea] px-1 py-0.5 rounded">wallet_added</code>) are transmitted to MongoDB Atlas.
        </p>
      </div>

    </div>
  );
}
