import React, { useState } from 'react';
import { AlertItem, WatchlistItem } from '../types';
import { ASSETS } from '../data/mockData';
import { 
  ShieldAlert, 
  Filter, 
  Radio, 
  MapPin, 
  Maximize2, 
  Trash2, 
  Plus, 
  Car, 
  Check, 
  AlertTriangle, 
  CheckCircle2, 
  Archive, 
  Eye, 
  Send,
  SlidersHorizontal,
  X
} from 'lucide-react';

interface AlertsViewProps {
  alerts: AlertItem[];
  watchlist: WatchlistItem[];
  onArchiveAlert: (id: string) => void;
  onFalsePositiveAlert: (id: string) => void;
  onDismissAlert: (id: string) => void;
  onMonitorAlert: (id: string) => void;
  onOpenDispatchModal: (alert: AlertItem) => void;
  onAddWatchlistItem: (plate: string, category: WatchlistItem['category']) => void;
  onRemoveWatchlistItem: (id: string) => void;
  onSelectPlateForTracking: (plate: string) => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({
  alerts,
  watchlist,
  onArchiveAlert,
  onFalsePositiveAlert,
  onDismissAlert,
  onMonitorAlert,
  onOpenDispatchModal,
  onAddWatchlistItem,
  onRemoveWatchlistItem,
  onSelectPlateForTracking
}) => {
  const [filterType, setFilterType] = useState<'all' | 'stolen' | 'suspicious' | 'hotlist'>('all');
  const [newPlateInput, setNewPlateInput] = useState<string>('');
  const [newCategory, setNewCategory] = useState<WatchlistItem['category']>('STOLEN');
  const [previewImageModal, setPreviewImageModal] = useState<string | null>(null);

  const filteredAlerts = filterType === 'all'
    ? alerts
    : alerts.filter(a => a.type === filterType);

  const handleAddWatchlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlateInput.trim()) return;
    onAddWatchlistItem(newPlateInput.trim().toUpperCase(), newCategory);
    setNewPlateInput('');
  };

  return (
    <div className="h-full overflow-y-auto pr-1">
      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-4 sm:gap-6">
        
        {/* Left Column: Real-Time Alerts Feed */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-4">
          
          {/* Header */}
          <header className="flex flex-wrap justify-between items-end mb-1 gap-2">
            <div>
              <h1 className="font-sans font-bold text-2xl sm:text-3xl text-white">Real-Time Alerts</h1>
              <p className="font-mono text-xs text-[#cfc4c5] mt-1">Live feed of flagged entities within sector.</p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 bg-[#1b1c1c] p-1 rounded-lg border border-[#4c4546]/40">
              <button 
                onClick={() => setFilterType('all')}
                className={`px-3 py-1 rounded text-xs font-mono transition-colors ${
                  filterType === 'all' 
                    ? 'bg-[#4cd7f6]/20 text-[#4cd7f6] border border-[#4cd7f6]/40 font-bold' 
                    : 'text-[#988e90] hover:text-white'
                }`}
              >
                All ({alerts.length})
              </button>
              <button 
                onClick={() => setFilterType('stolen')}
                className={`px-3 py-1 rounded text-xs font-mono transition-colors ${
                  filterType === 'stolen' 
                    ? 'bg-[#ffb4ab]/20 text-[#ffb4ab] border border-[#ffb4ab]/40 font-bold' 
                    : 'text-[#988e90] hover:text-white'
                }`}
              >
                Stolen
              </button>
              <button 
                onClick={() => setFilterType('suspicious')}
                className={`px-3 py-1 rounded text-xs font-mono transition-colors ${
                  filterType === 'suspicious' 
                    ? 'bg-amber-950/40 text-amber-300 border border-amber-500/40 font-bold' 
                    : 'text-[#988e90] hover:text-white'
                }`}
              >
                Suspicious
              </button>
            </div>
          </header>

          {filteredAlerts.length === 0 ? (
            <div className="glass-panel rounded-xl p-8 text-center border border-[#4c4546]/40">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
              <h3 className="font-bold text-base text-white">System Monitoring Active</h3>
              <p className="text-xs font-mono text-[#988e90] mt-1">No confirmed watchlist matches. Configured ANPR sources are ready for processing.</p>
            </div>
          ) : (
            filteredAlerts.map((alert) => {
              const isStolen = alert.type === 'stolen';
              const isSuspicious = alert.type === 'suspicious';

              return (
                <article 
                  key={alert.id}
                  className={`glass-modal rounded-xl p-4 sm:p-5 flex flex-col gap-4 shadow-xl border-l-4 ${
                    isStolen 
                      ? 'border-l-[#ffb4ab] active-glow border border-[#ffb4ab]/30' 
                      : 'border-l-[#c7c6c6] border border-[#4c4546]/40'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex flex-wrap justify-between items-start gap-2">
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 font-mono text-xs uppercase rounded-sm flex items-center gap-1.5 font-bold ${
                        isStolen 
                          ? 'bg-[#93000a] text-[#ffdad6] border border-[#ffb4ab]/50' 
                          : 'bg-[#292a2a] text-[#c7c6c6] border border-[#988e90]/40'
                      }`}>
                        {isStolen ? (
                          <ShieldAlert className="w-3.5 h-3.5 text-[#ffb4ab]" />
                        ) : (
                          <Radio className="w-3.5 h-3.5 text-[#4cd7f6]" />
                        )}
                        {alert.title.toUpperCase()}
                      </span>
                      <span className="font-mono text-xs text-[#988e90]">
                        {alert.timestamp} • {alert.sector}
                      </span>
                    </div>

                    <div 
                      onClick={() => onSelectPlateForTracking(alert.plate)}
                      className={`plate-badge text-lg cursor-pointer hover:scale-105 transition-transform ${
                        isStolen ? 'border-2 border-[#ffb4ab]' : 'border-2 border-[#4cd7f6]'
                      }`}
                      title="Click to Track Trajectory"
                    >
                      {alert.plate}
                    </div>
                  </div>

                  {/* Card Body Grid: Snapshot (Left) + Minimap (Right) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Camera Snapshot with Targeting Reticle */}
                    <div className="relative rounded-lg overflow-hidden border border-[#4c4546]/50 aspect-video bg-black group">
                      <img 
                        src={alert.snapshotUrl} 
                        alt={`${alert.title} Snapshot`}
                        className="w-full h-full object-cover grayscale contrast-125"
                      />
                      {/* ANPR Badge Overlay */}
                      <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm px-2 py-0.5 rounded text-[#4cd7f6] font-mono text-[10px] font-bold border border-[#4cd7f6]/50">
                        ANPR HIT {alert.confidence}%
                      </div>
                      {/* Reticle bounding box border */}
                      <div className="absolute inset-2 border-2 border-[#ffb4ab]/60 rounded pointer-events-none"></div>
                      <button
                        onClick={() => setPreviewImageModal(alert.snapshotUrl)}
                        className="absolute bottom-2 right-2 p-1 bg-black/80 hover:bg-black text-white rounded border border-[#4c4546]/60 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Enlarge Snapshot"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Minimap Tactical View */}
                    <div className="relative rounded-lg overflow-hidden border border-[#4c4546]/50 aspect-video bg-[#0e0e0e] group flex items-center justify-center">
                      <div 
                        className="absolute inset-0 bg-cover bg-center opacity-70 group-hover:opacity-90 transition-opacity"
                        style={{ backgroundImage: `url('${alert.minimapUrl}')` }}
                      ></div>
                      
                      {/* Minimap Overlay Controls */}
                      <div className="absolute inset-0 flex flex-col justify-between p-2 pointer-events-none">
                        <div className="self-end pointer-events-auto">
                          <button 
                            onClick={() => onSelectPlateForTracking(alert.plate)}
                            className="bg-[#1b1c1c]/90 backdrop-blur-md p-1.5 rounded border border-[#4c4546]/60 text-white hover:text-[#4cd7f6] transition-colors"
                            title="Expand to Full GIS Map"
                          >
                            <Maximize2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="bg-[#1b1c1c]/90 backdrop-blur-md border border-[#4c4546]/60 rounded px-2 py-1 flex items-center gap-2 self-start">
                          <span className="w-2 h-2 rounded-full bg-[#ffb4ab] animate-ping"></span>
                          <span className="font-mono text-[10px] text-white tracking-wider uppercase font-bold">
                            Tracking Active
                          </span>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Notes / Details */}
                  {alert.notes && (
                    <p className="text-xs font-mono text-[#cfc4c5] bg-[#121414]/60 p-2.5 rounded border border-[#4c4546]/30">
                      <strong className="text-white">INTEL NOTE:</strong> {alert.notes}
                    </p>
                  )}

                  {/* Action Buttons Toolbar */}
                  <div className="flex flex-wrap justify-end gap-2.5 pt-3 border-t border-[#4c4546]/30">
                    <button 
                      onClick={() => onArchiveAlert(alert.id)}
                      className="px-3.5 py-1.5 border border-[#4c4546] text-[#cfc4c5] hover:text-white hover:border-[#988e90] font-mono text-xs rounded transition-colors uppercase tracking-wider flex items-center gap-1.5"
                    >
                      <Archive className="w-3.5 h-3.5" /> Archive
                    </button>

                    <button 
                      onClick={() => onFalsePositiveAlert(alert.id)}
                      className="px-3.5 py-1.5 border border-[#4c4546] text-[#cfc4c5] hover:text-white hover:border-[#988e90] font-mono text-xs rounded transition-colors uppercase tracking-wider"
                    >
                      False Positive
                    </button>

                    {isStolen ? (
                      <button 
                        onClick={() => onOpenDispatchModal(alert)}
                        className="px-5 py-1.5 bg-[#93000a] hover:bg-[#93000a]/80 text-[#ffdad6] font-mono text-xs rounded transition-colors uppercase tracking-wider font-bold flex items-center gap-2 shadow-lg border border-[#ffb4ab]/40"
                      >
                        <Send className="w-3.5 h-3.5 text-[#ffb4ab]" /> Dispatch Units
                      </button>
                    ) : (
                      <button 
                        onClick={() => onMonitorAlert(alert.id)}
                        className="px-5 py-1.5 bg-[#292a2a] hover:bg-[#343535] text-[#4cd7f6] border border-[#4cd7f6]/50 font-mono text-xs rounded transition-colors uppercase tracking-wider font-bold flex items-center gap-2"
                      >
                        <Eye className="w-3.5 h-3.5" /> Monitor
                      </button>
                    )}
                  </div>
                </article>
              );
            })
          )}

        </div>

        {/* Right Column: Watchlist Management Panel */}
        <div className="col-span-12 lg:col-span-4">
          <div className="glass-panel rounded-xl border border-[#4c4546]/40 flex flex-col sticky top-4 bg-[#1b1c1c]/95 shadow-2xl">
            
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-[#4c4546]/30 bg-[#121414]/60 rounded-t-xl">
              <h2 className="font-sans font-bold text-base text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-[#4cd7f6] text-lg">list_alt</span>
                Watchlist Management
              </h2>
              <p className="font-mono text-xs text-[#988e90] mt-0.5">Manage active entity tracking.</p>

              {/* Add Plate Form */}
              <form onSubmit={handleAddWatchlist} className="mt-4 flex flex-col gap-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Car className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#988e90]" />
                    <input 
                      type="text"
                      value={newPlateInput}
                      onChange={(e) => setNewPlateInput(e.target.value)}
                      placeholder="Enter Plate ID..."
                      className="w-full bg-[#121414] border border-[#4c4546] text-white rounded py-2 pl-9 pr-3 text-xs font-mono uppercase placeholder:normal-case placeholder:font-sans placeholder:text-[#988e90] focus:outline-none focus:border-[#4cd7f6]"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="bg-[#c7c6c6] hover:bg-white text-black font-mono font-bold text-xs px-4 py-2 rounded uppercase transition-colors shadow"
                  >
                    Add
                  </button>
                </div>

                <div className="flex items-center gap-2 text-[10px] font-mono text-[#988e90]">
                  <span>Category:</span>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as WatchlistItem['category'])}
                    className="bg-[#121414] border border-[#4c4546] text-[#e3e2e2] rounded px-2 py-1 text-[11px] font-mono"
                  >
                    <option value="STOLEN">STOLEN VEHICLE</option>
                    <option value="POI - SURVEILLANCE">POI - SURVEILLANCE</option>
                    <option value="EXPIRED REG">EXPIRED REG</option>
                    <option value="TRAFFIC VIOLATOR">TRAFFIC VIOLATOR</option>
                    <option value="CUSTOM">CUSTOM</option>
                  </select>
                </div>
              </form>
            </div>

            {/* Watchlist Items Scrollable List */}
            <div className="p-3 flex flex-col gap-2 max-h-[calc(100vh-340px)] overflow-y-auto">
              {watchlist.map((item) => (
                <div 
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded bg-[#292a2a]/40 hover:bg-[#292a2a]/90 border border-transparent hover:border-[#4c4546] transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      onClick={() => onSelectPlateForTracking(item.plate)}
                      className="plate-badge text-xs border border-[#4cd7f6] text-black cursor-pointer hover:scale-105 transition-transform"
                      title="Track Trajectory"
                    >
                      {item.plate}
                    </div>
                    <div className="flex flex-col">
                      <span className={`font-mono text-[10px] uppercase font-bold tracking-wider ${
                        item.category === 'STOLEN' ? 'text-[#ffb4ab]' : 'text-[#4cd7f6]'
                      }`}>
                        {item.category}
                      </span>
                      <span className="font-mono text-[11px] text-[#988e90]">
                        Added: {item.addedAt}
                      </span>
                    </div>
                  </div>

                  <button 
                    onClick={() => onRemoveWatchlistItem(item.id)}
                    className="text-[#988e90] hover:text-[#ffb4ab] opacity-60 group-hover:opacity-100 transition-opacity p-1.5 rounded hover:bg-[#121414]"
                    title="Remove from Watchlist"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Watchlist Footer */}
            <div className="p-3 border-t border-[#4c4546]/30 text-center bg-[#121414]/50 rounded-b-xl">
              <span className="font-mono text-[10px] text-[#988e90] uppercase tracking-wider font-bold">
                TOTAL ACTIVE: {watchlist.length}
              </span>
            </div>

          </div>
        </div>

      </div>

      {/* Snapshot Enlarge Modal */}
      {previewImageModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#1b1c1c] border border-[#4c4546] rounded-xl max-w-2xl w-full p-4 relative shadow-2xl">
            <button 
              onClick={() => setPreviewImageModal(null)}
              className="absolute top-3 right-3 text-[#988e90] hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-bold text-white font-mono text-sm mb-3">High-Resolution Sensor Capture</h3>
            <img src={previewImageModal} alt="Capture" className="w-full rounded-lg border border-[#4c4546]" />
          </div>
        </div>
      )}
    </div>
  );
};
