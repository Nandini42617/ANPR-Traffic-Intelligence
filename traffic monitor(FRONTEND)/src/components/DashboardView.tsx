import React, { useState, useEffect } from 'react';
import { CameraFeed, DetectionLog, ScreenView } from '../types';
import { 
  Scan, 
  BarChart3, 
  BellRing, 
  ArrowUp, 
  Grid2X2, 
  Maximize2, 
  VideoOff, 
  AlertTriangle, 
  ListFilter, 
  Play, 
  Pause, 
  RefreshCw, 
  Check, 
  ShieldAlert, 
  Radio,
  Eye,
  Sliders
} from 'lucide-react';

interface DashboardViewProps {
  cameraFeeds: CameraFeed[];
  detectionLogs: DetectionLog[];
  onSelectPlateForTracking: (plate: string) => void;
  onNavigate: (screen: ScreenView) => void;
  activeAlertsCount: number;
  onFocusCamera: (camera: CameraFeed) => void;
  onToggleCamReconnection: (camId: string) => void;
  isStreamPaused: boolean;
  onToggleStreamPause: () => void;
  onAddManualDetection: (plate: string, isAlert: boolean) => void;
  onStartProcess?: (videoName?: string, file?: File) => void;
  job?: any;
  sources?: Array<{ id: string; filename: string; display_name: string; latitude?: number; longitude?: number }>;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  cameraFeeds,
  detectionLogs,
  onSelectPlateForTracking,
  onNavigate,
  activeAlertsCount,
  onFocusCamera,
  onToggleCamReconnection,
  isStreamPaused,
  onToggleStreamPause,
  onAddManualDetection,
  onStartProcess,
  job
  , sources = []
}) => {
  const [layoutMode, setLayoutMode] = useState<'2x2' | '1x1' | 'fullscreen'>('2x2');
  const [isHdStream, setIsHdStream] = useState<boolean>(true);
  const [filterAlertsOnly, setFilterAlertsOnly] = useState<boolean>(false);
  const totalDetectionsCount = Number(job?.completed_result?.result?.plates_detected || detectionLogs.length);
  const [hoveredBox, setHoveredBox] = useState<string | null>(null);

  const displayedLogs = filterAlertsOnly
    ? detectionLogs.filter(log => log.isAlert)
    : detectionLogs;

  return (
    <div className="flex flex-col gap-3 sm:gap-4 h-full overflow-y-auto lg:overflow-hidden pr-0.5">
      {/* Top 3 Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4 shrink-0">
        {/* Metric 1: Total Detections */}
        <div className="glass-panel rounded-lg p-3 sm:p-4 flex items-center justify-between border border-[#4c4546]/40 bg-[#1b1c1c]/90 shadow-md">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#292a2a] flex items-center justify-center text-[#c7c6c6] border border-[#988e90]/30 shadow-inner shrink-0">
              <Scan className="w-5 h-5 sm:w-6 sm:h-6 text-[#4cd7f6]" />
            </div>
            <div>
              <p className="font-mono text-[10px] sm:text-xs text-[#988e90] uppercase tracking-wider mb-0.5 sm:mb-1">
                Total Detections (Today)
              </p>
              <div className="flex items-baseline gap-2">
                <h3 className="font-mono text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-wide">
                  {totalDetectionsCount.toLocaleString()}
                </h3>
                <span className="text-emerald-400 text-[10px] sm:text-xs font-bold font-mono flex items-center bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-500/30">
                  <ArrowUp className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-0.5" /> 12%
                </span>
              </div>
            </div>
          </div>
          <span className="text-[10px] font-mono text-[#988e90] hidden xl:inline-block">24h Rolling</span>
        </div>

        {/* Metric 2: Avg OCR Accuracy */}
        <div className="glass-panel rounded-lg p-3 sm:p-4 flex items-center justify-between border border-[#4c4546]/40 bg-[#1b1c1c]/90 shadow-md">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#292a2a] flex items-center justify-center text-[#c7c6c6] border border-[#988e90]/30 shadow-inner shrink-0">
              <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-[#c7c6c6]" />
            </div>
            <div>
              <p className="font-mono text-[10px] sm:text-xs text-[#988e90] uppercase tracking-wider mb-0.5 sm:mb-1">
                Avg. OCR Accuracy
              </p>
              <div className="flex items-baseline gap-2">
                <h3 className="font-mono text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-wide">
                  N/A
                </h3>
                <span className="text-[#988e90] text-[10px] sm:text-xs font-mono">
                  Target: &gt;90%
                </span>
              </div>
            </div>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/30 px-2 py-1 rounded border border-emerald-500/20 hidden xl:inline-block">
            STABLE
          </span>
        </div>

        {/* Metric 3: Active Alerts */}
        <div 
          onClick={() => onNavigate('alerts')}
          className="glass-panel rounded-lg p-3 sm:p-4 flex items-center justify-between border border-[#ffb4ab]/40 bg-[#1b1c1c]/90 alert-glow cursor-pointer hover:bg-[#292a2a] transition-all sm:col-span-2 lg:col-span-1"
        >
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#ffb4ab]/10 flex items-center justify-center text-[#ffb4ab] border border-[#ffb4ab]/40 animate-pulse shrink-0">
              <BellRing className="w-5 h-5 sm:w-6 sm:h-6 text-[#ffb4ab]" />
            </div>
            <div>
              <p className="font-mono text-[10px] sm:text-xs text-[#ffb4ab] uppercase tracking-wider mb-0.5 sm:mb-1 font-bold">
                Active Alerts
              </p>
              <div className="flex items-baseline gap-2">
                <h3 className="font-mono text-xl sm:text-2xl lg:text-3xl font-bold text-[#ffb4ab] tracking-wide">
                  {activeAlertsCount}
                </h3>
                <span className="text-[#ffb4ab]/90 text-[10px] sm:text-xs uppercase font-bold font-mono bg-[#93000a]/40 px-2 py-0.5 rounded border border-[#ffb4ab]/30">
                  Requires Attention
                </span>
              </div>
            </div>
          </div>
          <span className="text-[11px] font-mono text-[#ffb4ab] uppercase tracking-wider underline hover:text-white hidden sm:inline-block">
            View All &rarr;
          </span>
        </div>
      </div>

      {/* Main Workspace: Camera Grid (Left) + Live Log (Right) */}
      <div className="flex flex-col lg:flex-row flex-1 gap-3 sm:gap-4 min-h-0 lg:overflow-hidden">
        
        {/* Camera Tactical Feeds Grid */}
        <div className="flex-1 glass-panel rounded-xl border border-[#4c4546]/40 p-2 sm:p-3 flex flex-col bg-[#1b1c1c]/95 min-h-[480px] lg:min-h-0">
          {/* Header Controls */}
          <div className="flex flex-wrap justify-between items-center px-1 sm:px-2 py-1.5 sm:py-2 mb-2 border-b border-[#4c4546]/30 shrink-0 gap-2">
            <div className="flex items-center gap-2 sm:gap-3">
              <h3 className="font-sans font-bold text-base sm:text-lg text-white flex items-center gap-2">
                <Grid2X2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#4cd7f6]" />
                Live Tactical Feeds
              </h3>
              <span className="text-[10px] font-mono text-[#988e90] bg-[#121414] px-2 py-0.5 rounded border border-[#4c4546]/40 hidden xs:inline-block">
                4 FEEDS CONNECTED
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <button 
                id="layout-toggle-btn"
                onClick={() => setLayoutMode(layoutMode === '2x2' ? '1x1' : '2x2')}
                className="bg-[#292a2a] text-[#cfc4c5] hover:text-white px-2.5 py-1 rounded text-xs font-mono font-medium transition-colors border border-[#4c4546]/50 flex items-center gap-1"
              >
                Layout: {layoutMode}
              </button>
              
              <button 
                id="hd-stream-toggle-btn"
                onClick={() => setIsHdStream(!isHdStream)}
                className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-colors border ${
                  isHdStream 
                    ? 'bg-[#4cd7f6]/20 text-[#4cd7f6] border-[#4cd7f6]/40' 
                    : 'bg-[#292a2a] text-[#988e90] border-[#4c4546]/50'
                }`}
              >
                {isHdStream ? 'HD (1080p)' : 'SD (480p)'}
              </button>

              <button 
                onClick={() => document.getElementById('video-upload-input')?.click()}
                title="Upload a video for ANPR processing"
                className="bg-[#93000a]/30 hover:bg-[#93000a]/50 text-[#ffb4ab] border border-[#ffb4ab]/40 px-2 py-1 rounded text-xs font-mono flex items-center gap-1"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Process Video</span>
              </button>
              {onStartProcess && <select aria-label="Bundled video" defaultValue="" onChange={e => { if (e.target.value) onStartProcess(e.target.value); e.currentTarget.value = ''; }} className="bg-[#292a2a] text-[#cfc4c5] border border-[#4c4546]/50 px-2 py-1 rounded text-xs font-mono"><option value="">Select source</option>{sources.map(source => <option key={source.id} value={source.filename}>{source.filename}</option>)}</select>}
              <input id="video-upload-input" type="file" accept="video/*" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (file && onStartProcess) onStartProcess(undefined, file); e.currentTarget.value = ''; }} />
            </div>
          </div>

          {/* Grid of Feeds */}
          <div className={`grid gap-2 flex-1 min-h-[360px] lg:min-h-0 ${
            layoutMode === '2x2' ? 'grid-cols-1 sm:grid-cols-2 auto-rows-fr lg:grid-rows-2' : 'grid-cols-1 grid-rows-1'
          }`}>
            
            {cameraFeeds.slice(0, layoutMode === '2x2' ? 4 : 1).map((cam) => {
              const isOffline = cam.status !== 'live';

              return (
                <div 
                  key={cam.id}
                  className="relative rounded-lg overflow-hidden border border-[#4c4546]/50 bg-[#121414] group flex flex-col min-h-[190px] sm:min-h-[210px] lg:min-h-0"
                >
                  {/* Camera image background */}
                  {cam.videoUrl ? (
                    <div className="absolute inset-0 bg-black">
                      <video src={cam.videoUrl} autoPlay muted loop playsInline className="h-full w-full object-cover opacity-80" onError={(event) => { event.currentTarget.style.display = 'none'; }} />
                      <div className="absolute inset-0 scanline opacity-20 pointer-events-none"></div>
                    </div>
                  ) : cam.bgImage && !isOffline ? (
                    <div 
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-[1.02]"
                      style={{ backgroundImage: `url('${cam.bgImage}')` }}
                    >
                      {/* Subtle scanline overlay */}
                      <div className="absolute inset-0 scanline opacity-20 pointer-events-none"></div>
                    </div>
                  ) : (
                    /* Honest source unavailable state */
                    <div className="absolute inset-0 bg-[#0d0e0f] flex flex-col items-center justify-center p-4">
                      <div className="text-center z-10 opacity-70">
                        <VideoOff className="w-8 h-8 sm:w-10 sm:h-10 text-[#ffb4ab] mx-auto mb-2 animate-bounce" />
                        <p className="font-mono text-xs uppercase tracking-widest text-[#ffb4ab] font-bold">
                          SOURCE UNAVAILABLE
                        </p>
                        <p className="font-mono text-[10px] text-[#988e90] mt-1">
                          No playable source is available from the backend.
                        </p>
                        <button
                          onClick={() => onToggleCamReconnection(cam.id)}
                          className="mt-3 px-3 py-1 bg-[#292a2a] hover:bg-[#343535] text-xs font-mono text-white rounded border border-[#4c4546] flex items-center gap-1.5 mx-auto"
                        >
                          <RefreshCw className="w-3 h-3 text-[#4cd7f6]" /> Refresh Source
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Bounding Boxes & AI Telemetry Overlays */}
                  {!isOffline && cam.detections.map((box) => (
                    <div 
                      key={box.id}
                      className={`bounding-box cursor-pointer ${box.isAlert ? 'border-[#ffb4ab] bg-[#ffb4ab]/15 bounding-box-alert' : 'border-[#4cd7f6]'}`}
                      style={{
                        top: box.top,
                        left: box.left,
                        width: box.width,
                        height: box.height
                      }}
                      onClick={() => {
                        if (box.isAlert) {
                          onNavigate('alerts');
                        } else {
                          onSelectPlateForTracking('XYZ-9921');
                          onNavigate('trajectory');
                        }
                      }}
                      onMouseEnter={() => setHoveredBox(box.id)}
                      onMouseLeave={() => setHoveredBox(null)}
                    >
                      <div className={`absolute -top-6 left-0 font-mono text-[10px] px-1.5 py-0.5 whitespace-nowrap font-bold shadow-md ${
                        box.isAlert 
                          ? 'bg-[#93000a] text-[#ffdad6] border border-[#ffb4ab]' 
                          : 'bg-[#4cd7f6] text-black'
                      }`}>
                        {box.label}
                      </div>
                    </div>
                  ))}

                  {/* Top Feed UI Tags */}
                  <div className="absolute top-2 left-2 flex items-center gap-1.5 z-20 pointer-events-auto">
                    <span className={`font-mono text-[10px] px-2 py-0.5 sm:py-1 rounded border backdrop-blur-md font-bold ${
                      isOffline 
                        ? 'bg-[#1b1c1c]/90 text-[#ffb4ab] border-[#ffb4ab]/50' 
                        : 'bg-[#1b1c1c]/80 text-white border-[#4c4546]/60'
                    }`}>
                      {cam.name}
                    </span>

                    {cam.videoUrl ? (
                      <span className="bg-[#1b1c1c]/90 backdrop-blur-md text-[#4cd7f6] font-mono text-[10px] px-1.5 sm:px-2 py-0.5 sm:py-1 rounded flex items-center gap-1 border border-[#4cd7f6]/40">
                        <span className="w-1.5 h-1.5 bg-[#4cd7f6] rounded-full"></span> VIDEO SOURCE
                      </span>
                    ) : null}
                  </div>

                  {/* Top Right Quick Cam Options */}
                  <div className="absolute top-2 right-2 flex items-center gap-1 z-20">
                    <button 
                      onClick={() => onFocusCamera(cam)}
                      className="p-1 rounded bg-[#121414]/80 text-[#cfc4c5] hover:text-white hover:bg-black/90 backdrop-blur-sm border border-[#4c4546]/40 transition-colors"
                      title="Inspect Camera In Full View"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Bottom Telemetry Bar */}
                  {!isOffline && (
                    <div className="absolute bottom-2 left-2 right-2 bg-[#121414]/85 backdrop-blur-md rounded border border-[#4c4546]/40 px-2 py-1 flex items-center justify-between text-[10px] font-mono text-[#cfc4c5] z-20">
                      <div className="truncate mr-2">
                        <span className="text-[#988e90]">LOC:</span> {cam.location}
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        <span><strong className="text-white">{cam.fps}</strong> FPS</span>
                        <span>FLOW: <strong className="text-[#4cd7f6]">{cam.trafficFlow?.split(' ')[0] || 'MOD'}</strong></span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Detection Stream (Right Sidebar on Desktop, bottom on mobile) */}
        <aside className="w-full lg:w-80 xl:w-96 glass-panel rounded-xl border border-[#4c4546]/40 flex flex-col overflow-hidden shrink-0 bg-[#1b1c1c]/95 max-h-96 lg:max-h-none h-auto lg:h-full">
          {/* Header */}
          <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-[#4c4546]/30 bg-[#121414]/60 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#4cd7f6] text-sm">list_alt</span>
              <h3 className="font-bold text-sm text-white">Live Detection Log</h3>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => setFilterAlertsOnly(!filterAlertsOnly)}
                className={`p-1 rounded text-xs transition-colors border ${
                  filterAlertsOnly 
                    ? 'bg-[#ffb4ab]/20 text-[#ffb4ab] border-[#ffb4ab]/40' 
                    : 'bg-[#292a2a] text-[#988e90] border-[#4c4546]/40 hover:text-white'
                }`}
                title={filterAlertsOnly ? 'Show All Detections' : 'Show Alerts Only'}
              >
                <ListFilter className="w-3.5 h-3.5" />
              </button>

              <button 
                onClick={onToggleStreamPause}
                className={`p-1 rounded text-xs transition-colors border ${
                  isStreamPaused 
                    ? 'bg-amber-950/40 text-amber-300 border-amber-500/40' 
                    : 'bg-[#292a2a] text-[#988e90] border-[#4c4546]/40 hover:text-white'
                }`}
                title={isStreamPaused ? 'Resume Stream' : 'Pause Stream'}
              >
                {isStreamPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              </button>

              <span className="flex h-2.5 w-2.5 relative">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isStreamPaused ? 'bg-amber-400' : 'bg-[#4cd7f6]'} opacity-75`}></span>
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isStreamPaused ? 'bg-amber-400' : 'bg-[#4cd7f6]'}`}></span>
              </span>
            </div>
          </div>

          {/* Sub-bar Filter Status */}
          {filterAlertsOnly && (
            <div className="bg-[#93000a]/20 border-b border-[#ffb4ab]/30 px-3 py-1 flex items-center justify-between text-[11px] font-mono text-[#ffb4ab]">
              <span>Filtering: High-Priority Alert Flags</span>
              <button onClick={() => setFilterAlertsOnly(false)} className="underline hover:text-white">Clear</button>
            </div>
          )}

          {/* Detection Items Stream */}
          <div className="flex-1 overflow-y-auto p-2 sm:p-3 flex flex-col gap-2 sm:gap-2.5 min-h-0" id="detection-stream-container">
            {displayedLogs.map((log) => {
              if (log.isAlert) {
                return (
                  /* Alert Item Card */
                  <div 
                    key={log.id}
                    className="bg-[#ffb4ab]/5 border border-[#ffb4ab]/35 rounded p-2.5 sm:p-3 relative overflow-hidden group hover:bg-[#ffb4ab]/10 transition-all cursor-pointer shadow-sm"
                    onClick={() => {
                      onSelectPlateForTracking(log.plate);
                      onNavigate('trajectory');
                    }}
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#ffb4ab]"></div>
                    
                    <div className="flex justify-between items-start mb-2">
                      <div className="plate-badge text-sm sm:text-base border-2 border-[#ffb4ab] text-black">
                        {log.plate}
                      </div>
                      <span className="font-mono text-[10px] text-[#ffb4ab] flex items-center gap-1 font-bold bg-[#93000a]/40 px-1.5 py-0.5 rounded border border-[#ffb4ab]/30">
                        <AlertTriangle className="w-3 h-3 text-[#ffb4ab]" /> {log.alertType || 'HOTLIST'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 text-xs font-mono text-[#cfc4c5]">
                      <div className="text-white font-bold truncate">{log.camera}</div>
                      <div className="text-right text-[#988e90]">{log.timestamp}</div>
                      <div className="text-[#4cd7f6]">Conf: {log.confidence}%</div>
                      <div className="text-right text-[#ffb4ab] font-bold truncate">
                        {log.watchlistName || 'Watchlist A'}
                      </div>
                    </div>

                    {/* Quick action buttons on hover */}
                    <div className="mt-2 pt-2 border-t border-[#4c4546]/30 flex justify-between items-center opacity-80 group-hover:opacity-100 transition-opacity">
                      <span className="text-[10px] font-mono text-[#988e90]">
                        {log.vehicleClass || 'Sedan'} · {log.speedMph || 55} mph
                      </span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectPlateForTracking(log.plate);
                          onNavigate('trajectory');
                        }}
                        className="text-[10px] font-mono text-[#4cd7f6] hover:underline flex items-center gap-1"
                      >
                        Track Trajectory &rarr;
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                /* Standard Detection Item Card */
                <div 
                  key={log.id}
                  className="bg-[#292a2a]/40 border border-[#4c4546]/40 rounded p-2.5 sm:p-3 hover:bg-[#292a2a]/80 transition-all cursor-pointer group"
                  onClick={() => {
                    onSelectPlateForTracking(log.plate);
                    onNavigate('trajectory');
                  }}
                >
                  <div className="flex justify-between items-start mb-1.5 sm:mb-2">
                    <div className="plate-badge text-xs border border-gray-400 text-black">
                      {log.plate}
                    </div>
                    <span className="text-[10px] font-mono text-[#988e90]">
                      {log.timestamp}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1 text-[11px] font-mono text-[#cfc4c5]">
                    <div className="truncate">{log.camera}</div>
                    <div className="text-right text-[#4cd7f6]">Conf: {log.confidence}%</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Stream Status */}
          <div className="p-2 border-t border-[#4c4546]/30 bg-[#121414]/50 flex justify-between items-center text-[10px] font-mono text-[#988e90] shrink-0">
            <span>Active Stream: {displayedLogs.length} events</span>
            <span className="text-emerald-400">FPS: 30 / Latency: 12ms</span>
          </div>
        </aside>
      </div>
    </div>
  );
};
