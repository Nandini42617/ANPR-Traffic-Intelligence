import React, { useState, useEffect } from 'react';
import { TrackedTarget, TrajectoryPoint } from '../types';
import { RealMap } from './RealMap';
import { 
  Radar, 
  Search, 
  Filter, 
  Plus, 
  Minus, 
  Crosshair, 
  Layers, 
  Play, 
  RotateCcw, 
  Compass, 
  MapPin, 
  Gauge, 
  Navigation,
  CheckCircle2,
  Share2
} from 'lucide-react';

interface TrajectoryViewProps {
  activePlate: string;
  onSelectPlate: (plate: string) => void;
  onDispatchAlert: (plate: string) => void;
  events?: any[];
  sources?: any[];
}

export const TrajectoryView: React.FC<TrajectoryViewProps> = ({
  activePlate,
  onSelectPlate,
  onDispatchAlert,
  events = [],
  sources = []
}) => {
  const availablePlates = Array.from(new Set(events.map(e => e.normalized_plate).filter(Boolean)));
  const [selectedTargetPlate, setSelectedTargetPlate] = useState<string>(activePlate || availablePlates[0] || '');
  const [customPlateInput, setCustomPlateInput] = useState<string>('');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [activeLayer, setActiveLayer] = useState<'all' | 'traffic' | 'cameras' | 'heatmap'>('all');
  const [selectedNodeIndex, setSelectedNodeIndex] = useState<number>(0);
  const [isPlayingReplay, setIsPlayingReplay] = useState<boolean>(false);
  const [mobileTab, setMobileTab] = useState<'map' | 'timeline'>('map');

  useEffect(() => {
    if (activePlate) {
      setSelectedTargetPlate(activePlate);
    }
  }, [activePlate]);

  const targetEvents = events.filter(e => e.normalized_plate === selectedTargetPlate || e.global_vehicle_id === selectedTargetPlate);
  const targetData: TrackedTarget = { plate: selectedTargetPlate || 'NO RECOGNIZED PLATE', status: targetEvents.length ? 'TRACKING' : 'LOST', totalDistance: targetEvents.length > 1 ? 'Calculated from points' : 'N/A', avgSpeed: 'N/A', lastSeenLocation: targetEvents.at(-1)?.camera_id || 'Awaiting processed data', vehicleModel: targetEvents[0]?.vehicle_class || 'N/A', color: '#475569', alerts: [], history: targetEvents.map((e, i) => ({ id: `${e.global_vehicle_id}-${i}`, timestamp: `${Number(e.timestamp || 0).toFixed(2)}s`, cameraName: e.camera_id, sector: e.location || 'Configured camera', direction: e.direction || 'N/A', lat: Number(e.latitude || 0), lng: Number(e.longitude || 0), speedMph: 0, conf: Number(e.ocr_confidence || e.plate_confidence || 0) * 100, isLatest: i === targetEvents.length - 1 })) };

  // Handle timeline replay playback
  useEffect(() => {
    if (!isPlayingReplay) return;
    const interval = setInterval(() => {
      setSelectedNodeIndex(prev => {
        if (prev <= 0) {
          setIsPlayingReplay(false);
          return targetData.history.length - 1;
        }
        return prev - 1;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, [isPlayingReplay, targetData.history.length]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = customPlateInput.trim().toUpperCase();
    if (availablePlates.includes(query)) {
      setCustomPlateInput('');
    } else {
      /* Unknown queries remain empty; the backend is the source of truth. */
      if (!query) return;
      setSelectedTargetPlate('');
      /*
        plate: query,
        status: 'TRACKING',
        totalDistance: '6.4 mi',
        avgSpeed: '38 mph',
        lastSeenLocation: 'Sector 5 - Midtown Tunnel',
        vehicleModel: '2022 Custom Vehicle',
        color: '#475569',
        alerts: ['Custom Tracked Entity'],
        history: [
          {
            id: `tp-${Date.now()}-1`,
            timestamp: new Date().toLocaleTimeString(),
            cameraName: 'Camera #55 (Midtown)',
            sector: 'Sector 5',
            direction: 'Northbound',
            lat: 40.7484,
            lng: -73.9857,
            speedMph: 38,
            conf: 97.5,
            isLatest: true
          },
          {
            id: `tp-${Date.now()}-2`,
            timestamp: new Date(Date.now() - 300000).toLocaleTimeString(),
            cameraName: 'Camera #31 (Expressway)',
            sector: 'Sector 3',
            direction: 'Northbound',
            lat: 40.7282,
            lng: -73.9942,
            speedMph: 42,
            conf: 96.0
          }
        ]
      }; */
      setSelectedTargetPlate(query);
      onSelectPlate(query);
    }
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-[#121414] border border-[#4c4546]/30 rounded-xl">
      
      {/* Mobile Tab Switcher (< md) */}
      <div className="md:hidden flex border-b border-[#4c4546]/40 bg-[#1b1c1c] shrink-0 font-mono text-xs">
        <button
          onClick={() => setMobileTab('map')}
          className={`flex-1 py-2.5 text-center font-bold transition-colors ${
            mobileTab === 'map'
              ? 'bg-[#292a2a] text-[#4cd7f6] border-b-2 border-[#4cd7f6]'
              : 'text-[#988e90] hover:text-white'
          }`}
        >
          GIS Surveillance Map
        </button>
        <button
          onClick={() => setMobileTab('timeline')}
          className={`flex-1 py-2.5 text-center font-bold transition-colors flex items-center justify-center gap-1.5 ${
            mobileTab === 'timeline'
              ? 'bg-[#292a2a] text-[#4cd7f6] border-b-2 border-[#4cd7f6]'
              : 'text-[#988e90] hover:text-white'
          }`}
        >
          <span>Target Intel & Log</span>
          <span className="bg-[#4cd7f6]/20 text-[#4cd7f6] px-1.5 py-0.2 rounded text-[10px]">
            {targetData.plate}
          </span>
        </button>
      </div>

      <div className="flex flex-col md:flex-row flex-1 h-full overflow-hidden">
        {/* Left Sidebar: Trajectory Target Summary & History Timeline */}
        <aside className={`w-full md:w-80 lg:w-96 bg-[#1b1c1c] border-r border-[#4c4546]/30 flex flex-col h-full z-20 shrink-0 ${
          mobileTab === 'timeline' ? 'flex' : 'hidden md:flex'
        }`}>
          
          {/* Search & Quick Target Switcher */}
          <div className="p-3 border-b border-[#4c4546]/30 bg-[#121414]/60 shrink-0">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#988e90]" />
              <input 
                type="text"
                value={customPlateInput}
                onChange={(e) => setCustomPlateInput(e.target.value)}
                placeholder="Enter recognized plate..."
                className="w-full bg-[#292a2a] border border-[#4c4546]/60 text-white rounded py-1.5 pl-9 pr-3 text-xs font-mono placeholder:font-sans placeholder:text-[#988e90] focus:outline-none focus:border-[#4cd7f6]"
              />
            </form>

            {/* Quick Select Chips */}
            <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1">
              {availablePlates.map((plate) => (
                <button
                  key={plate}
                  onClick={() => {
                    setSelectedTargetPlate(plate);
                    onSelectPlate(plate);
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono whitespace-nowrap transition-colors border ${
                    selectedTargetPlate === plate 
                      ? 'bg-[#4cd7f6]/20 text-[#4cd7f6] border-[#4cd7f6]/50 font-bold' 
                      : 'bg-[#292a2a] text-[#cfc4c5] border-[#4c4546]/40 hover:text-white'
                  }`}
                >
                  {plate}
                </button>
              ))}
            </div>
          </div>

          {/* Active Target Card */}
          <div className="p-3 sm:p-4 border-b border-[#4c4546]/30 bg-[#1f2020]/50 shrink-0">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="font-mono text-[11px] text-[#988e90] uppercase tracking-wider font-semibold">
                Active Target
              </span>
              <span className="bg-[#ffb4ab]/15 text-[#ffb4ab] px-2 py-0.5 rounded font-mono text-[10px] uppercase border border-[#ffb4ab]/30 flex items-center gap-1 font-bold animate-pulse">
                <Radar className="w-3 h-3 text-[#ffb4ab]" /> {targetData.status}
              </span>
            </div>

            {/* License Plate Display */}
            <div className="plate-badge text-lg sm:text-xl border-2 border-[#4cd7f6] text-black mb-2 sm:mb-3 anpr-hit">
              {targetData.plate}
            </div>

            {/* Target Model details */}
            <div className="text-[11px] font-mono text-[#cfc4c5] mb-2 sm:mb-3 flex items-center gap-1.5">
              <span className="text-[#988e90]">Vehicle:</span>
              <span className="text-white font-medium">{targetData.vehicleModel}</span>
            </div>

            {/* 2-column Metrics */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[#121414] p-2 sm:p-2.5 rounded border border-[#4c4546]/30">
                <span className="font-mono text-[10px] text-[#988e90] block mb-0.5 uppercase">Total Dist</span>
                <span className="font-mono text-sm sm:text-base font-bold text-white">{targetData.totalDistance}</span>
              </div>
              <div className="bg-[#121414] p-2 sm:p-2.5 rounded border border-[#4c4546]/30">
                <span className="font-mono text-[10px] text-[#988e90] block mb-0.5 uppercase">Avg Speed</span>
                <span className="font-mono text-sm sm:text-base font-bold text-white">{targetData.avgSpeed}</span>
              </div>
              <div className="col-span-2 bg-[#121414] p-2 sm:p-2.5 rounded border border-[#4c4546]/30">
                <span className="font-mono text-[10px] text-[#988e90] block mb-0.5 uppercase">Last Seen</span>
                <span className="font-mono text-xs text-[#4cd7f6] truncate block font-bold">
                  {targetData.lastSeenLocation}
                </span>
              </div>
            </div>
          </div>

          {/* Timeline Header with Replay Action */}
          <div className="px-3 sm:px-4 py-2 border-b border-[#4c4546]/30 flex items-center justify-between bg-[#1f2020] shrink-0">
            <span className="font-sans font-bold text-xs sm:text-sm text-white">Detection History</span>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => {
                  setSelectedNodeIndex(targetData.history.length - 1);
                  setIsPlayingReplay(!isPlayingReplay);
                }}
                className={`px-2 py-1 rounded text-[10px] font-mono flex items-center gap-1 border transition-colors ${
                  isPlayingReplay 
                    ? 'bg-[#4cd7f6]/20 text-[#4cd7f6] border-[#4cd7f6]' 
                    : 'bg-[#292a2a] text-[#cfc4c5] border-[#4c4546] hover:text-white'
                }`}
              >
                {isPlayingReplay ? <RotateCcw className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                {isPlayingReplay ? 'Replay...' : 'Replay Path'}
              </button>
            </div>
          </div>

          {/* Timeline Entries List */}
          <div className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-0 min-h-0">
            {targetData.history.map((node, index) => {
              const isSelected = selectedNodeIndex === index;
              const isLatest = index === 0;

              return (
                <div 
                  key={node.id}
                  onClick={() => setSelectedNodeIndex(index)}
                  className={`relative pl-6 py-2.5 sm:py-3 border-b border-[#4c4546]/20 last:border-0 group cursor-pointer transition-all rounded-r-lg ${
                    isSelected ? 'bg-[#292a2a]/90' : 'hover:bg-[#292a2a]/40'
                  }`}
                >
                  {/* Node circle & vertical connecting track */}
                  <div className={`absolute left-1.5 top-5 -translate-y-1/2 w-2.5 h-2.5 rounded-full transition-all ${
                    isLatest 
                      ? 'bg-[#4cd7f6] shadow-[0_0_10px_rgba(76,215,246,0.9)] animate-pulse' 
                      : isSelected 
                        ? 'bg-white shadow-[0_0_8px_white]' 
                        : 'bg-[#988e90]'
                  }`} />

                  {index < targetData.history.length - 1 && (
                    <div className="absolute left-[8px] top-6 h-full w-[2px] bg-[#4cd7f6]/30"></div>
                  )}

                  <div className="flex justify-between items-start mb-0.5">
                    <span className="font-mono text-xs font-bold text-[#4cd7f6]">
                      {node.timestamp}
                    </span>
                    {isLatest && (
                      <span className="bg-[#4cd7f6]/20 text-[#4cd7f6] font-mono text-[9px] px-1.5 py-0.5 rounded border border-[#4cd7f6]/30 font-bold">
                        LATEST
                      </span>
                    )}
                  </div>

                  <span className="font-sans text-xs font-semibold text-white block mt-0.5">
                    {node.cameraName}
                  </span>

                  <div className="flex items-center justify-between text-[11px] font-mono text-[#988e90] mt-1">
                    <span>Dir: <strong className="text-[#cfc4c5]">{node.direction}</strong></span>
                    <span>{node.speedMph} mph</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Button at bottom */}
          <div className="p-3 border-t border-[#4c4546]/30 bg-[#121414] shrink-0">
            <button 
              onClick={() => onDispatchAlert(targetData.plate)}
              className="w-full py-2 bg-[#93000a] hover:bg-[#93000a]/80 text-[#ffdad6] font-mono text-xs uppercase font-bold tracking-wider rounded border border-[#ffb4ab]/40 transition-colors flex items-center justify-center gap-2 shadow-lg"
            >
              <Radar className="w-4 h-4" /> Dispatch Units
            </button>
          </div>
        </aside>

        {/* Right Canvas: High-Tech GIS Surveillance Map */}
        <section className={`flex-1 relative bg-[#0e0e0e] overflow-hidden flex flex-col min-h-[360px] md:min-h-0 ${
          mobileTab === 'map' ? 'flex' : 'hidden md:flex'
        }`}>
          
          {/* GIS Map Image Canvas with Tactical Overlay */}
          <div 
            className="absolute inset-0 w-full h-full bg-cover bg-center transition-all duration-300"
            style={{ 
              backgroundImage: 'none',
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: 'center center'
            }}
          >
            {/* Radial grid texture */}
            <div className="absolute inset-0 opacity-15" style={{ 
              backgroundImage: 'radial-gradient(#4cd7f6 1px, transparent 1px)', 
              backgroundSize: '28px 28px' 
            }}></div>
          </div>

          {/* Vector SVG Trajectory Path Layer */}
          <div className="absolute inset-0"><RealMap sources={sources} history={targetData.history} /></div>
          <svg className="hidden" preserveAspectRatio="none">
            {/* Glow filter definition */}
            <defs>
              <filter id="cyan-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Plotted Trajectory Path */}
            <path 
              d="M 18% 82% L 32% 66% L 40% 50% L 54% 44% L 72% 28%"
              fill="none"
              stroke="#4cd7f6"
              strokeDasharray="8 4"
              strokeWidth="3.5"
              filter="url(#cyan-glow)"
              className="map-glow"
            />

            {/* Direction Arrowheads */}
            <polygon fill="#4cd7f6" points="32%,66% 30%,68% 34%,68%" transform="rotate(45 32% 66%)" />
            <polygon fill="#4cd7f6" points="54%,44% 52%,46% 56%,46%" transform="rotate(25 54% 44%)" />

            {/* Nodes */}
            <circle cx="18%" cy="82%" r="6" fill="#1f2020" stroke="#988e90" strokeWidth="2.5" />
            <circle cx="32%" cy="66%" r="6" fill="#1f2020" stroke="#988e90" strokeWidth="2.5" />
            <circle cx="40%" cy="50%" r="6" fill="#1f2020" stroke="#988e90" strokeWidth="2.5" />
            <circle cx="54%" cy="44%" r="6" fill="#1f2020" stroke="#988e90" strokeWidth="2.5" />

            {/* Pulsing Active Target Node (at end of line) */}
            <circle 
              cx="72%" 
              cy="28%" 
              r="8" 
              fill="#4cd7f6" 
              stroke="#ffffff" 
              strokeWidth="2.5" 
              filter="url(#cyan-glow)"
            >
              <animate attributeName="r" values="7;13;7" dur="2s" repeatCount="indefinite" />
            </circle>
          </svg>

          {/* Floating Contextual Live Ping Box (Positioned near active target node) */}
          <div className="absolute top-[20%] right-3 sm:right-auto sm:left-[60%] lg:left-[68%] bg-[#1b1c1c]/95 backdrop-blur-md border border-[#4cd7f6]/60 rounded-lg p-2.5 sm:p-3 shadow-2xl w-48 sm:w-56 z-30 pointer-events-auto">
            <div className="flex items-center justify-between text-[#4cd7f6] font-mono text-[9px] sm:text-[10px] uppercase font-bold mb-1">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#4cd7f6] animate-ping"></span>
                LIVE PING
              </span>
              <span>CONF 99.2%</span>
            </div>
            <div className="font-sans font-bold text-xs sm:text-sm text-white">Cam #108 Hit</div>
            <div className="font-mono text-[10px] sm:text-[11px] text-[#cfc4c5] mt-0.5">
              40.7128° N, 74.0060° W
            </div>
            <div className="mt-1.5 pt-1.5 border-t border-[#4c4546]/40 flex justify-between items-center text-[9px] sm:text-[10px] font-mono">
              <span className="text-[#988e90]">Target Speed:</span>
              <span className="text-emerald-400 font-bold">36 MPH (N-Bound)</span>
            </div>
          </div>

          {/* Map Top Bar Controls */}
          <div className="absolute top-3 left-3 z-30 flex items-center gap-2">
            <div className="bg-[#1b1c1c]/90 backdrop-blur-md px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg border border-[#4c4546]/50 flex items-center gap-2 text-[10px] sm:text-xs font-mono max-w-[220px] sm:max-w-none truncate">
              <Compass className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#4cd7f6] shrink-0" />
              <span className="text-white font-bold truncate">GIS GRID: CONFIGURED CAMERAS</span>
            </div>
          </div>

          {/* Map Floating Control Buttons (Right) */}
          <div className="absolute top-3 right-3 z-30 flex flex-col gap-1.5 sm:gap-2">
            <button 
              id="map-zoom-in"
              onClick={() => setZoomLevel(prev => Math.min(prev + 15, 180))}
              className="w-8 h-8 sm:w-10 sm:h-10 bg-[#1b1c1c]/90 hover:bg-[#292a2a] backdrop-blur-md border border-[#4c4546]/60 rounded-lg flex items-center justify-center text-white hover:text-[#4cd7f6] transition-colors shadow-lg active:scale-95"
              title="Zoom In"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button 
              id="map-zoom-out"
              onClick={() => setZoomLevel(prev => Math.max(prev - 15, 70))}
              className="w-8 h-8 sm:w-10 sm:h-10 bg-[#1b1c1c]/90 hover:bg-[#292a2a] backdrop-blur-md border border-[#4c4546]/60 rounded-lg flex items-center justify-center text-white hover:text-[#4cd7f6] transition-colors shadow-lg active:scale-95"
              title="Zoom Out"
            >
              <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button 
              id="map-recenter"
              onClick={() => setZoomLevel(100)}
              className="w-8 h-8 sm:w-10 sm:h-10 bg-[#1b1c1c]/90 hover:bg-[#292a2a] backdrop-blur-md border border-[#4c4546]/60 rounded-lg flex items-center justify-center text-white hover:text-[#4cd7f6] transition-colors shadow-lg active:scale-95"
              title="Re-Center"
            >
              <Crosshair className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button 
              id="map-layers"
              onClick={() => {
                const layers: Array<'all' | 'traffic' | 'cameras' | 'heatmap'> = ['all', 'traffic', 'cameras', 'heatmap'];
                const next = layers[(layers.indexOf(activeLayer) + 1) % layers.length];
                setActiveLayer(next);
              }}
              className="w-8 h-8 sm:w-10 sm:h-10 bg-[#1b1c1c]/90 hover:bg-[#292a2a] backdrop-blur-md border border-[#4c4546]/60 rounded-lg flex items-center justify-center text-white hover:text-[#4cd7f6] transition-colors shadow-lg active:scale-95"
              title={`Layer: ${activeLayer}`}
            >
              <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>

          {/* Map Bottom Telemetry Legend */}
          <div className="mt-auto p-2 sm:p-3 m-2 sm:m-3 bg-[#121414]/90 backdrop-blur-md rounded-lg border border-[#4c4546]/40 flex flex-wrap items-center justify-between text-[10px] sm:text-xs font-mono z-30 gap-1.5 sm:gap-2">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#4cd7f6]"></span>
                <span className="text-[#cfc4c5]">Active</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#988e90]"></span>
                <span className="text-[#cfc4c5]">History</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#ffb4ab]"></span>
                <span className="text-[#cfc4c5]">Alert</span>
              </div>
            </div>
            <div className="text-[#988e90] text-[10px] sm:text-[11px]">
              Layer: <strong className="text-white uppercase">{activeLayer}</strong> | Zoom: <strong className="text-[#4cd7f6]">{zoomLevel}%</strong>
            </div>
          </div>

        </section>
      </div>
    </div>
  );
};
