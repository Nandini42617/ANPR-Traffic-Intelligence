import React, { useState } from 'react';
import { BottleneckItem } from '../types';
import { RealMap } from './RealMap';
import { 
  Gauge, 
  TrendingUp, 
  Clock, 
  Car, 
  Activity, 
  MapPin, 
  Zap, 
  Route, 
  Video, 
  AlertOctagon, 
  ShieldCheck,
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface AnalyticsViewProps {
  onOpenDeployModal: (location: string) => void;
  onSelectBottleneckView: (item: BottleneckItem) => void;
  analytics?: any;
  sources?: any[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  onOpenDeployModal,
  onSelectBottleneckView,
  analytics = {} as any,
  sources = []
}) => {
  const [activeOverlay, setActiveOverlay] = useState<'speed' | 'route' | 'video'>('speed');
  const [bottlenecks] = useState<BottleneckItem[]>([]);
  const [selectedTimeHover, setSelectedTimeHover] = useState<string | null>('Current job');
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  const classEntries = Object.entries(analytics.by_class || {}) as Array<[string, number]>;
  const classTotal = classEntries.reduce((sum, [, count]) => sum + Number(count), 0);

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden border border-[#4c4546]/30 bg-[#121414] flex flex-col">
      
      {/* Background Satellite Data Artery Map */}
      <div 
        className="absolute inset-0 w-full h-full bg-cover bg-center opacity-40 z-0"
        style={{ backgroundImage: 'none' }}
      >
        <RealMap sources={sources} history={[]} />
        <div className="absolute inset-0 map-grid-overlay opacity-30"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#121414] via-transparent to-[#121414]/80"></div>
      </div>

      {/* Main Workspace Layout */}
      <div className="relative z-10 w-full h-full p-4 sm:p-6 grid grid-cols-12 gap-4 overflow-y-auto">
        
        {/* Left Column: Macro Flow Stats & Vehicle Distribution */}
        <div className="col-span-12 lg:col-span-4 xl:col-span-3 flex flex-col gap-4">
          
          {/* Title Card */}
          <div className="glass-panel rounded-lg p-4 flex flex-col gap-1 border-l-4 border-l-[#4cd7f6] bg-[#1b1c1c]/90 shadow-lg">
            <h1 className="font-sans font-bold text-lg text-white">Macro Flow Analytics</h1>
            <p className="font-mono text-xs text-[#cfc4c5]">City-Wide Origin-Destination</p>
            <div className="mt-2 flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              LIVE ARTERY SENSING ACTIVE
            </div>
          </div>

          {/* Flow Key Metrics */}
          <div className="glass-panel rounded-lg p-4 flex flex-col gap-3.5 bg-[#1b1c1c]/90 shadow-lg">
            <div className="flex justify-between items-center border-b border-[#4c4546]/30 pb-2.5">
              <span className="font-mono text-xs text-[#988e90] uppercase tracking-wider">Current Vol</span>
              <span className="font-mono text-xl font-bold text-[#4cd7f6]">{analytics.total_observations ?? 'N/A'}</span>
            </div>
            
            <div className="flex justify-between items-center border-b border-[#4c4546]/30 pb-2.5">
              <span className="font-mono text-xs text-[#988e90] uppercase tracking-wider">Avg Velocity</span>
              <span className="font-mono text-xl font-bold text-white">
                N/A <span className="text-xs text-[#988e90] font-normal">km/h</span>
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="font-mono text-xs text-[#988e90] uppercase tracking-wider">Est. Delay</span>
              <span className="font-mono text-xl font-bold text-[#ffb4ab] bg-[#93000a]/30 px-2 py-0.5 rounded border border-[#ffb4ab]/30">
                N/A
              </span>
            </div>
          </div>

          {/* Vehicle Class Distribution */}
          <div className="glass-panel rounded-lg p-4 flex-1 flex flex-col justify-between bg-[#1b1c1c]/90 shadow-lg min-h-60">
            <h3 className="font-mono text-xs text-[#988e90] uppercase tracking-wider mb-3 flex items-center gap-2 font-bold">
              <Car className="w-4 h-4 text-[#4cd7f6]" />
              Vehicle Class Dist
            </h3>

            <div className="flex flex-col gap-3.5">
              {classEntries.length ? classEntries.map(([name, count], index) => { const percentage = Math.round(Number(count) / classTotal * 100); return <div className="flex flex-col gap-1" key={name}><div className="flex justify-between text-xs font-mono"><span className="text-[#e3e2e2]">{name}</span><span className="text-[#4cd7f6] font-bold">{percentage}%</span></div><div className="w-full bg-[#292a2a] h-2 rounded-full overflow-hidden"><div className={`${index === 0 ? 'bg-[#4cd7f6]' : 'bg-[#988e90]'} h-full rounded-full transition-all duration-700`} style={{ width: `${percentage}%` }} /></div></div>; }) : <div className="text-xs font-mono text-[#988e90]">No vehicle sample yet</div>}
            </div>

            <div className="mt-3 pt-3 border-t border-[#4c4546]/30 flex justify-between items-center text-[10px] font-mono text-[#988e90]">
              <span>{analytics.total_observations ? `Sampled over ${analytics.total_observations} observations` : 'Awaiting processed traffic data'}</span>
              <span className="text-[#4cd7f6]">Existing ANPR pipeline</span>
            </div>
          </div>

        </div>

        {/* Center / Right Column: Floating Tools & Bottom Metric Cards */}
        <div className="col-span-12 lg:col-span-8 xl:col-span-9 flex flex-col justify-between gap-4">
          
          {/* Top Right Floating Overlay Controls */}
          <div className="flex justify-between items-center">
            {/* Time range pills */}
            <div className="bg-[#1b1c1c]/90 backdrop-blur-md p-1 rounded-lg border border-[#4c4546]/50 flex gap-1">
              {(['24h', '7d', '30d'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={`px-3 py-1 rounded text-xs font-mono uppercase transition-colors ${
                    timeRange === r 
                      ? 'bg-[#4cd7f6]/20 text-[#4cd7f6] border border-[#4cd7f6]/40 font-bold' 
                      : 'text-[#988e90] hover:text-white'
                  }`}
                >
                  {r} Window
                </button>
              ))}
            </div>

            {/* Artery Overlay Switcher */}
            <div className="bg-[#1b1c1c]/90 backdrop-blur-md rounded-lg flex border border-[#4c4546]/50 overflow-hidden shadow-lg">
              <button 
                id="analytics-speed-overlay"
                onClick={() => setActiveOverlay('speed')}
                className={`p-2.5 transition-colors border-r border-[#4c4546]/40 ${
                  activeOverlay === 'speed' ? 'bg-[#4cd7f6]/20 text-[#4cd7f6]' : 'text-[#988e90] hover:text-white'
                }`}
                title="Speed Velocity Heatmap"
              >
                <Gauge className="w-4 h-4" />
              </button>
              <button 
                id="analytics-route-overlay"
                onClick={() => setActiveOverlay('route')}
                className={`p-2.5 transition-colors border-r border-[#4c4546]/40 ${
                  activeOverlay === 'route' ? 'bg-[#4cd7f6]/20 text-[#4cd7f6]' : 'text-[#988e90] hover:text-white'
                }`}
                title="Route Flow Density"
              >
                <Route className="w-4 h-4" />
              </button>
              <button 
                id="analytics-video-overlay"
                onClick={() => setActiveOverlay('video')}
                className={`p-2.5 transition-colors ${
                  activeOverlay === 'video' ? 'bg-[#4cd7f6]/20 text-[#4cd7f6]' : 'text-[#988e90] hover:text-white'
                }`}
                title="Camera Sensor Overlays"
              >
                <Video className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Central Spatial Visualizer Pill */}
          <div className="hidden sm:flex justify-center my-auto pointer-events-none">
            <div className="bg-[#1b1c1c]/80 backdrop-blur-md px-4 py-2 rounded-full border border-[#4c4546]/50 flex items-center gap-3 text-xs font-mono shadow-2xl">
              <Activity className="w-4 h-4 text-[#4cd7f6] animate-spin" style={{ animationDuration: '6s' }} />
              <span className="text-[#cfc4c5]">
                Processed Traffic Context: <strong className="text-white">New Delhi configured camera network</strong>
              </span>
            </div>
          </div>

          {/* Bottom Wide Grid: Peak Hour Congestion + Bottleneck Hotspots */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-auto">
            
            {/* Chart 1: Peak Hour Congestion Trend */}
            <div className="glass-panel rounded-lg p-4 flex flex-col bg-[#1b1c1c]/90 border border-[#4c4546]/40 shadow-lg min-h-64">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-mono text-xs text-[#988e90] uppercase tracking-wider flex items-center gap-2 font-bold">
                  <Activity className="w-4 h-4 text-[#4cd7f6]" />
                  Peak Hour Congestion Trend
                </h3>
                <span className="text-[10px] font-mono text-[#4cd7f6]">{selectedTimeHover}</span>
              </div>

              {/* SVG Line Chart */}
              <div className="flex-1 w-full relative flex items-end justify-between px-2 pb-6 pt-4 border-l border-b border-[#4c4546]/40">
                {/* Gradient Fill under curve */}
                <div 
                  className="absolute inset-0 z-0 opacity-40 pointer-events-none" 
                  style={{ background: 'linear-gradient(0deg, rgba(76, 215, 246, 0.2) 0%, transparent 100%)' }}
                ></div>

                <svg className="hidden" preserveAspectRatio="none" viewBox="0 0 100 100">
                  <path 
                    d="M0,80 C20,70 40,90 50,40 C60,-10 80,60 100,50" 
                    fill="none" 
                    stroke="#4cd7f6" 
                    strokeWidth="2.5" 
                    className="glow-active"
                  />
                  {/* Active Peak Circle Indicator at 12:00 */}
                  <circle 
                    cx="50" 
                    cy="40" 
                    r="4" 
                    fill="#081425" 
                    stroke="#4cd7f6" 
                    strokeWidth="2.5" 
                    className="animate-ping"
                  />
                  <circle 
                    cx="50" 
                    cy="40" 
                    r="3.5" 
                    fill="#4cd7f6" 
                    stroke="#ffffff" 
                    strokeWidth="1.5" 
                  />
                </svg>

                {/* X Axis Timestamps */}
                <span className="text-[10px] font-mono text-[#988e90] absolute bottom-1 left-2">06:00</span>
                <span className="text-[10px] font-mono text-[#4cd7f6] font-bold absolute bottom-1 left-1/2 -translate-x-1/2">
                  CURRENT JOB
                </span>
                <span className="text-[10px] font-mono text-[#988e90] absolute bottom-1 right-2">18:00</span>
              </div>
            </div>

            {/* Chart 2: Critical Bottlenecks Hotspots */}
            <div className="glass-panel rounded-lg p-4 flex flex-col bg-[#1b1c1c]/90 border border-[#4c4546]/40 shadow-lg min-h-64">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-mono text-xs text-[#988e90] uppercase tracking-wider flex items-center gap-2 font-bold">
                  <MapPin className="w-4 h-4 text-[#ffb4ab]" />
                  Critical Bottlenecks
                </h3>
                <span className="text-[10px] font-mono text-[#ffb4ab] bg-[#93000a]/30 px-2 py-0.5 rounded border border-[#ffb4ab]/30 font-bold">
                  {bottlenecks.length ? `${bottlenecks.length} ACTIVE` : 'NO ACTIVE BOTTLENECKS'}
                </span>
              </div>

              {/* Hotspot List */}
              <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1">
                {bottlenecks.map((item) => (
                  <div 
                    key={item.id}
                    className={`flex items-center justify-between p-2.5 rounded transition-all border-l-4 ${
                      item.severity === 'Critical' 
                        ? 'bg-[#ffb4ab]/5 hover:bg-[#ffb4ab]/10 border-l-[#ffb4ab] border border-[#ffb4ab]/20' 
                        : 'bg-[#292a2a]/40 hover:bg-[#292a2a]/80 border-l-[#c7c6c6] border border-[#4c4546]/20'
                    }`}
                  >
                    <div>
                      <div className="font-mono text-xs font-bold text-white">{item.location}</div>
                      <div className="text-[10px] text-[#cfc4c5] font-mono mt-0.5">
                        Flow Rate: <strong className={item.severity === 'Critical' ? 'text-[#ffb4ab]' : 'text-[#4cd7f6]'}>
                          {item.flowRate}%
                        </strong> ({item.severity})
                      </div>
                    </div>

                    <div>
                      {item.actionLabel === 'Deploy' ? (
                        <button 
                          onClick={() => onOpenDeployModal(item.location)}
                          className="bg-[#93000a] hover:bg-[#93000a]/80 text-[#ffdad6] border border-[#ffb4ab]/40 px-3 py-1.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider transition-colors flex items-center gap-1 shadow-md"
                        >
                          <Zap className="w-3 h-3 text-[#ffb4ab]" /> Deploy
                        </button>
                      ) : (
                        <button 
                          onClick={() => onSelectBottleneckView(item)}
                          className="bg-[#292a2a] hover:bg-[#343535] text-[#cfc4c5] hover:text-white border border-[#4c4546] px-3 py-1.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider transition-colors"
                        >
                          View
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
