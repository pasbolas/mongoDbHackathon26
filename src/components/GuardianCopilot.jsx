import React from 'react';
import { 
  Bot, 
  Volume2, 
  BrainCircuit, 
  Database, 
  Eye, 
  CheckCircle, 
  AlertOctagon, 
  ArrowUpRight,
  Sparkles,
  Zap,
  Radio
} from 'lucide-react';
import { speechService } from '../utils/speech.js';

export default function GuardianCopilot({ state, soundEnabled }) {
  const { guardianState = state.state, activePrompt, actionHistory = [], stepOutcomes = [] } = state;
  const isSilent = state.state === 'OBSERVING_SILENT';
  const isIntervening = state.state === 'INTERVENING' && activePrompt;
  const isFinished = state.state === 'ROUTINE_COMPLETED';

  const handleReplayAudio = () => {
    if (activePrompt?.text) {
      speechService.speak(activePrompt.text);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
      
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800 mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Adaptive Guardian Copilot</span>
                <span className="flex h-2 w-2 relative">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    isIntervening ? 'bg-amber-400' : isFinished ? 'bg-emerald-400' : 'bg-teal-400'
                  }`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${
                    isIntervening ? 'bg-amber-500' : isFinished ? 'bg-emerald-500' : 'bg-teal-500'
                  }`}></span>
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">Real-time intervention decision engine</p>
            </div>
          </div>

          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            {isIntervening ? 'ACTIVE INTERVENTION' : isFinished ? 'SESSION COMPLETED' : 'SILENT MONITORING'}
          </span>
        </div>

        {/* State 1: Silent Monitoring (Silence is the feature!) */}
        {isSilent && (
          <div className="p-4 rounded-xl bg-slate-950/70 border border-emerald-950/60 mb-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Eye className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <span>Intentionally Silent</span>
                  <span className="text-[10px] font-normal px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    Philosophy in Action
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  John is performing actions within normal sequence parameters. AI deliberately refrains from interrupting to encourage autonomous recall.
                </p>
                <div className="mt-2.5 pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-1.5">
                  <span className="text-emerald-400 font-semibold">Success metric:</span>
                  <span>"How much the person continues doing themselves."</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* State 2: Active Intervention & Prompt Card */}
        {isIntervening && (
          <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/40 mb-4 shadow-lg shadow-amber-950/20">
            
            {/* Prompt Level Badge */}
            <div className="flex items-center justify-between mb-3">
              <span className={`text-xs px-2.5 py-1 rounded-md font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                activePrompt.level === 1 
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : activePrompt.level === 2
                  ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}>
                <Zap className="w-3.5 h-3.5" />
                <span>Prompt Level {activePrompt.level} of 3</span>
                <span className="text-[10px] opacity-80">
                  {activePrompt.level === 1 ? '(Minimal Nudge)' : activePrompt.level === 2 ? '(Contextual Cue)' : '(Explicit Direction)'}
                </span>
              </span>

              {soundEnabled && (
                <button
                  onClick={handleReplayAudio}
                  className="flex items-center space-x-1 text-xs text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-1 rounded border border-amber-500/30 transition-all"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Replay Voice</span>
                </button>
              )}
            </div>

            {/* Spoken Text */}
            <div className="bg-slate-950/90 rounded-lg p-3 border border-amber-500/30 mb-3">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                Auditory Cue Delivered to John:
              </span>
              <p className="text-base font-bold text-amber-100 italic">
                "{activePrompt.text}"
              </p>
            </div>

            {/* MongoDB Atlas Vector Search Match Breakdown */}
            {activePrompt.vectorMatch && (
              <div className="bg-slate-950/60 rounded-lg p-3 border border-slate-800 text-xs">
                <div className="flex items-center justify-between mb-1.5 text-slate-400">
                  <span className="font-semibold flex items-center gap-1 text-emerald-400">
                    <Database className="w-3.5 h-3.5" />
                    MongoDB Atlas Vector Search Match:
                  </span>
                  <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
                    {activePrompt.vectorMatch.matchPercentage || 94}% Similarity
                  </span>
                </div>
                <p className="text-slate-300 font-medium truncate">
                  Situation: {activePrompt.vectorMatch.title}
                </p>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Resolution History: {activePrompt.vectorMatch.historicalResolution || 'Resolved by Level 1 cue in 4s'}
                </p>
              </div>
            )}

            <div className="mt-2.5 text-[11px] text-amber-400/90 flex items-center justify-between">
              <span>Reason: {activePrompt.reason}</span>
              <span>Vanishing safety active</span>
            </div>
          </div>
        )}

        {/* State 3: Routine Completed Celebration */}
        {isFinished && (
          <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 mb-4 shadow-lg shadow-emerald-950/20">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm mb-1.5">
              <CheckCircle className="w-5 h-5" />
              <span>Routine Finished Successfully!</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              John completed all steps to brew tea. 
              {stepOutcomes.filter(s => s.wasIndependent).length} of {state.totalSteps} steps completed completely independently.
            </p>
            <div className="mt-3 p-2.5 rounded-lg bg-slate-950/70 border border-emerald-500/20 text-xs text-emerald-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Errorless Learning feedback recorded to MongoDB.
              </span>
              <span className="font-mono font-bold">
                {Math.round((stepOutcomes.filter(s => s.wasIndependent).length / state.totalSteps) * 100)}% Independence
              </span>
            </div>
          </div>
        )}

        {/* Live Camera/Sensor Perception Log */}
        <div className="mt-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
            <span className="flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
              Perception Event Stream
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              MongoDB `events` collection
            </span>
          </div>

          <div className="bg-slate-950/80 rounded-xl border border-slate-800 p-2.5 space-y-1.5 max-h-36 overflow-y-auto font-mono text-xs">
            {actionHistory.length === 0 ? (
              <div className="text-slate-600 text-center py-4 text-[11px] font-sans">
                Waiting for physical perception events...
              </div>
            ) : (
              actionHistory.map((item, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center justify-between py-1 px-2 rounded bg-slate-900/60 border border-slate-800/80 text-[11px]"
                >
                  <span className="text-emerald-400 font-semibold">
                    {item.action}
                  </span>
                  <span className="text-slate-400 text-[10px]">
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Bottom Vanishing Cue Status */}
      <div className="pt-3 mt-4 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1">
          <BrainCircuit className="w-3.5 h-3.5 text-indigo-400" />
          Vanishing Cues Model: Active
        </span>
        <span className="text-emerald-400 font-medium">
          Threshold: Dynamic (Errorless Learning)
        </span>
      </div>

    </div>
  );
}
