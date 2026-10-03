import React from 'react';
import { 
  Activity, 
  PlayCircle, 
  BarChart2, 
  Database, 
  Volume2, 
  VolumeX, 
  RotateCcw,
  Shield
} from 'lucide-react';

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  dbStatus, 
  soundEnabled, 
  setSoundEnabled, 
  onReset 
}) {
  const navItems = [
    { id: 'live', label: 'Live Routine', icon: Activity, caption: 'Active assistant & actions' },
    { id: 'scenarios', label: 'Demo Scenarios', icon: PlayCircle, caption: '1-click judge walkthroughs' },
    { id: 'progress', label: 'Independence', icon: BarChart2, caption: 'Weekly vanishing cues' },
    { id: 'database', label: 'MongoDB Atlas', icon: Database, caption: 'Vector search & records' },
  ];

  return (
    <aside className="w-64 lg:w-72 bg-[#09090b] border-r border-[#1c1c1f] flex flex-col justify-between p-5 h-screen sticky top-0 flex-shrink-0 select-none">
      
      {/* Top Branding & Navigation */}
      <div className="space-y-8">
        
        {/* Apple-style minimalist header */}
        <div className="pt-2 px-2">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-white text-black flex items-center justify-center font-bold">
              <Shield className="w-4 h-4 fill-black" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-[#f5f5f7] tracking-tight">
                Memory Guardian
              </h1>
              <span className="text-[11px] text-[#86868b] block font-normal">
                Vanishing Assistance
              </span>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="space-y-1.5">
          <div className="text-[11px] font-medium text-[#6e6e73] uppercase tracking-wider px-3 mb-2">
            Overview
          </div>

          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                  isActive
                    ? 'bg-[#1c1c1e] text-[#f5f5f7] font-medium shadow-sm'
                    : 'text-[#86868b] hover:text-[#f5f5f7] hover:bg-[#141416]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#86868b]'}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm tracking-tight truncate">
                    {item.label}
                  </div>
                  <div className="text-[11px] text-[#6e6e73] truncate font-normal">
                    {item.caption}
                  </div>
                </div>
              </button>
            );
          })}
        </nav>

      </div>

      {/* Bottom Controls */}
      <div className="pt-6 border-t border-[#1c1c1f] space-y-3 px-1">
        
        {/* Voice Toggle */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-[#141416] hover:bg-[#1c1c1e] border border-[#242427] text-xs text-[#a1a1a6] hover:text-[#f5f5f7] transition-all"
        >
          <span className="flex items-center gap-2">
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-[#6e6e73]" />}
            <span>Voice Audio</span>
          </span>
          <span className="text-[11px] font-mono text-[#86868b]">
            {soundEnabled ? 'Enabled' : 'Muted'}
          </span>
        </button>

        {/* Reset Routine */}
        <button
          onClick={onReset}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#141416] hover:bg-[#1c1c1e] border border-[#242427] text-xs text-[#a1a1a6] hover:text-[#f5f5f7] transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Session</span>
        </button>

        {/* Database Status */}
        <div 
          onClick={() => setActiveTab('database')}
          className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#0e0e10] border border-[#1c1c1f] text-[11px] text-[#86868b] cursor-pointer hover:border-[#2a2a2e] transition-colors"
        >
          <span className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${dbStatus?.isAtlas ? 'bg-emerald-400' : 'bg-teal-400'}`}></span>
            <span>{dbStatus?.isAtlas ? 'MongoDB Atlas' : 'Local Hybrid'}</span>
          </span>
          <span className="text-[#6e6e73]">Vector Search</span>
        </div>

      </div>

    </aside>
  );
}
