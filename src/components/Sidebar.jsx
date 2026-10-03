import React from 'react';
import { 
  Video,
  Activity, 
  PlayCircle, 
  BarChart2, 
  Database, 
  Volume2, 
  VolumeX, 
  RotateCcw,
  Anchor as AnchorIcon
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
    { id: 'video', label: 'Video Input', icon: Video, caption: 'YouTube & edge vision AI' },
    { id: 'live', label: 'Live Activity', icon: Activity, caption: 'Sarah packing bag' },
    { id: 'scenarios', label: 'Demo Executions', icon: PlayCircle, caption: '3-stage demo walkthrough' },
    { id: 'progress', label: 'Observable Metrics', icon: BarChart2, caption: 'Sessions 1, 2, 3 data' },
    { id: 'database', label: 'MongoDB Atlas', icon: Database, caption: 'Episodes & Vector Search' },
  ];

  return (
    <aside className="w-64 lg:w-72 bg-[#f5f5f7] border-r border-[#e5e5ea] flex flex-col justify-between p-5 h-screen sticky top-0 flex-shrink-0 select-none font-mono">
      
      {/* Top Branding & Navigation */}
      <div className="space-y-8">
        
        {/* Anchor minimalist header */}
        <div className="pt-2 px-2">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#1d1d1f] text-white flex items-center justify-center font-bold">
              <AnchorIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-[#1d1d1f] tracking-tight">
                Anchor
              </h1>
              <span className="text-[11px] text-[#6e6e73] block font-normal">
                Privacy-First Adaptive Assistance
              </span>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="space-y-1.5">
          <div className="text-[11px] font-medium text-[#86868b] uppercase tracking-wider px-3 mb-2">
            Navigation
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
                    ? 'bg-white text-[#1d1d1f] font-semibold border border-[#e5e5ea] shadow-sm'
                    : 'text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-[#eaeaea]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#1d1d1f]' : 'text-[#86868b]'}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm tracking-tight truncate">
                    {item.label}
                  </div>
                  <div className="text-[11px] text-[#86868b] truncate font-normal">
                    {item.caption}
                  </div>
                </div>
              </button>
            );
          })}
        </nav>

      </div>

      {/* Bottom Controls */}
      <div className="pt-6 border-t border-[#e5e5ea] space-y-2.5 px-1">
        
        {/* Voice Toggle */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white hover:bg-[#eaeaea] border border-[#e5e5ea] text-xs text-[#1d1d1f] transition-all shadow-sm"
        >
          <span className="flex items-center gap-2">
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-600" /> : <VolumeX className="w-3.5 h-3.5 text-[#86868b]" />}
            <span>Voice Audio</span>
          </span>
          <span className="text-[11px] text-[#6e6e73]">
            {soundEnabled ? 'Enabled' : 'Muted'}
          </span>
        </button>

        {/* Reset Session */}
        <button
          onClick={onReset}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-[#eaeaea] border border-[#e5e5ea] text-xs text-[#1d1d1f] transition-all shadow-sm"
        >
          <RotateCcw className="w-3.5 h-3.5 text-[#6e6e73]" />
          <span>Reset Session</span>
        </button>

        {/* Database Status */}
        <div 
          onClick={() => setActiveTab('database')}
          className="flex items-center justify-between px-3 py-2 rounded-xl bg-white border border-[#e5e5ea] text-[11px] text-[#6e6e73] cursor-pointer hover:border-[#d1d1d6] transition-colors shadow-sm"
        >
          <span className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${dbStatus?.isAtlas ? 'bg-emerald-500' : 'bg-teal-500'}`}></span>
            <span className="text-[#1d1d1f] font-medium">{dbStatus?.isAtlas ? 'MongoDB Atlas' : 'Local Hybrid'}</span>
          </span>
          <span className="text-[#86868b]">Vector Search</span>
        </div>

      </div>

    </aside>
  );
}
