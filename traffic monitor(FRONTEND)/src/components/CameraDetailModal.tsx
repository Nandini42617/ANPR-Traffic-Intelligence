import React, { useState } from 'react';
import { CameraFeed } from '../types';
import { X, Maximize2, ShieldAlert, Radio, Camera, RefreshCw, ZoomIn, ZoomOut, Check } from 'lucide-react';

interface CameraDetailModalProps {
  camera: CameraFeed | null;
  onClose: () => void;
  onSelectPlateForTracking: (plate: string) => void;
}

export const CameraDetailModal: React.FC<CameraDetailModalProps> = ({
  camera,
  onClose,
  onSelectPlateForTracking
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isFrozen, setIsFrozen] = useState<boolean>(false);
  const [snapshotTaken, setSnapshotTaken] = useState<boolean>(false);

  if (!camera) return null;

  const handleCaptureSnapshot = () => {
    setSnapshotTaken(true);
    setTimeout(() => setSnapshotTaken(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#1b1c1c] border border-[#4c4546] rounded-xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl relative flex flex-col gap-4 max-h-[95vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-[#4c4546]/40 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#292a2a] flex items-center justify-center border border-[#4c4546]">
              <Radio className="w-4 h-4 text-[#4cd7f6]" />
            </div>
            <div>
              <h3 className="font-sans font-bold text-lg text-white flex items-center gap-2">
                {camera.name}
                <span className="bg-[#93000a] text-white font-mono text-[10px] px-2 py-0.5 rounded font-bold">
                  LIVE INSPECTION
                </span>
              </h3>
              <p className="font-mono text-xs text-[#988e90]">{camera.location}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#988e90] hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Canvas Container */}
        <div className="relative rounded-lg overflow-hidden border border-[#4c4546]/60 bg-black aspect-video flex items-center justify-center group">
          {camera.bgImage ? (
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-200"
              style={{ 
                backgroundImage: `url('${camera.bgImage}')`,
                transform: `scale(${zoomLevel / 100})`
              }}
            >
              {/* Scanline */}
              <div className="absolute inset-0 scanline opacity-25 pointer-events-none"></div>
            </div>
          ) : (
            <div className="text-center text-[#ffb4ab] font-mono text-xs">
              Signal reconnecting...
            </div>
          )}

          {/* Bounding Boxes */}
          {camera.detections.map((box) => (
            <div 
              key={box.id}
              onClick={() => {
                onSelectPlateForTracking('XYZ-9921');
                onClose();
              }}
              className={`bounding-box cursor-pointer ${box.isAlert ? 'border-[#ffb4ab] bg-[#ffb4ab]/15' : 'border-[#4cd7f6]'}`}
              style={{
                top: box.top,
                left: box.left,
                width: box.width,
                height: box.height
              }}
            >
              <div className="absolute -top-7 left-0 bg-black text-[#4cd7f6] font-mono text-xs px-2 py-0.5 font-bold border border-[#4cd7f6]">
                {box.label}
              </div>
            </div>
          ))}

          {/* Telemetry Overlay */}
          <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded border border-[#4c4546]/60 font-mono text-xs text-[#cfc4c5] flex items-center gap-3">
            <span>RES: <strong className="text-white">{camera.resolution}</strong></span>
            <span>FPS: <strong className="text-white">{camera.fps}</strong></span>
            <span>FLOW: <strong className="text-[#4cd7f6]">{camera.trafficFlow}</strong></span>
          </div>

          {/* Snapshot Confirmation Pill */}
          {snapshotTaken && (
            <div className="absolute inset-0 bg-white/20 flex items-center justify-center pointer-events-none animate-pulse">
              <div className="bg-black/90 text-emerald-400 font-mono px-4 py-2 rounded-lg border border-emerald-500 flex items-center gap-2 text-sm font-bold">
                <Check className="w-5 h-5" /> Snapshot Captured to Evidence Archive
              </div>
            </div>
          )}
        </div>

        {/* Controls Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs font-mono">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setZoomLevel(prev => Math.min(prev + 20, 200))}
              className="px-3 py-1.5 bg-[#292a2a] hover:bg-[#343535] text-white rounded border border-[#4c4546] flex items-center gap-1.5"
            >
              <ZoomIn className="w-3.5 h-3.5" /> Zoom In ({zoomLevel}%)
            </button>
            <button 
              onClick={() => setZoomLevel(prev => Math.max(prev - 20, 100))}
              className="px-3 py-1.5 bg-[#292a2a] hover:bg-[#343535] text-white rounded border border-[#4c4546] flex items-center gap-1.5"
            >
              <ZoomOut className="w-3.5 h-3.5" /> Reset Zoom
            </button>
            <button 
              onClick={() => setIsFrozen(!isFrozen)}
              className={`px-3 py-1.5 rounded border flex items-center gap-1.5 ${
                isFrozen ? 'bg-amber-950/40 text-amber-300 border-amber-500' : 'bg-[#292a2a] text-white border-[#4c4546]'
              }`}
            >
              {isFrozen ? 'Unfreeze Stream' : 'Freeze Frame'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={handleCaptureSnapshot}
              className="px-4 py-1.5 bg-[#4cd7f6]/20 hover:bg-[#4cd7f6]/30 text-[#4cd7f6] border border-[#4cd7f6]/50 rounded flex items-center gap-1.5 font-bold"
            >
              <Camera className="w-3.5 h-3.5" /> Capture Evidence Snapshot
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
