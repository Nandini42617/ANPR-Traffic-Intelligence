import React, { useState } from 'react';
import { X, Sliders, Volume2, Shield, Eye, Database, Check } from 'lucide-react';

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const [ocrThreshold, setOcrThreshold] = useState<number>(90);
  const [soundAlerts, setSoundAlerts] = useState<boolean>(true);
  const [streamBitrate, setStreamBitrate] = useState<'4K' | '1080p' | '720p'>('1080p');
  const [tacticalContrast, setTacticalContrast] = useState<string>('monochrome-command');
  const [autoArchiveMins, setAutoArchiveMins] = useState<number>(60);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#1b1c1c] border border-[#4c4546] rounded-xl max-w-lg w-full p-6 shadow-2xl relative flex flex-col gap-4">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-[#4c4546]/40 pb-3">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-[#4cd7f6]" />
            <h3 className="font-sans font-bold text-lg text-white">System & ANPR Engine Preferences</h3>
          </div>
          <button onClick={onClose} className="text-[#988e90] hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Controls */}
        <div className="space-y-4 text-xs font-mono">
          
          {/* OCR Confidence Slider */}
          <div className="bg-[#121414] p-3 rounded-lg border border-[#4c4546]/40">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[#e3e2e2] font-bold">ANPR OCR Confidence Threshold</span>
              <span className="text-[#4cd7f6] font-bold text-sm">{ocrThreshold}%</span>
            </div>
            <input 
              type="range" 
              min={70} 
              max={99} 
              value={ocrThreshold} 
              onChange={(e) => setOcrThreshold(Number(e.target.value))}
              className="w-full accent-[#4cd7f6]"
            />
            <span className="text-[10px] text-[#988e90] block mt-1">
              Plates below threshold are flagged as UNK-#### in detection feed.
            </span>
          </div>

          {/* Sound Alerts */}
          <div className="bg-[#121414] p-3 rounded-lg border border-[#4c4546]/40 flex items-center justify-between">
            <div>
              <div className="text-[#e3e2e2] font-bold flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-[#4cd7f6]" /> Audio Alarm Chime for Watchlist Hits
              </div>
              <span className="text-[10px] text-[#988e90]">Sound high-frequency tone on stolen plate match</span>
            </div>
            <button
              onClick={() => setSoundAlerts(!soundAlerts)}
              className={`w-12 h-6 rounded-full p-0.5 transition-colors border ${
                soundAlerts ? 'bg-[#4cd7f6] border-[#4cd7f6]' : 'bg-[#292a2a] border-[#4c4546]'
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-black transition-transform ${soundAlerts ? 'translate-x-6' : 'translate-x-0'}`}></div>
            </button>
          </div>

          {/* Stream Bitrate */}
          <div className="bg-[#121414] p-3 rounded-lg border border-[#4c4546]/40 flex items-center justify-between">
            <div>
              <span className="text-[#e3e2e2] font-bold block">Surveillance Stream Resolution</span>
              <span className="text-[10px] text-[#988e90]">Edge encoding preset</span>
            </div>
            <div className="flex gap-1">
              {(['720p', '1080p', '4K'] as const).map((res) => (
                <button
                  key={res}
                  onClick={() => setStreamBitrate(res)}
                  className={`px-2.5 py-1 rounded text-[11px] border transition-colors ${
                    streamBitrate === res 
                      ? 'bg-[#4cd7f6]/20 text-[#4cd7f6] border-[#4cd7f6]' 
                      : 'bg-[#292a2a] text-[#988e90] border-[#4c4546]'
                  }`}
                >
                  {res}
                </button>
              ))}
            </div>
          </div>

          {/* Visual Theme Mode */}
          <div className="bg-[#121414] p-3 rounded-lg border border-[#4c4546]/40 flex items-center justify-between">
            <div>
              <span className="text-[#e3e2e2] font-bold block">Command Theme Palette</span>
              <span className="text-[10px] text-[#988e90]">High-contrast night operation mode</span>
            </div>
            <span className="bg-[#292a2a] text-[#c7c6c6] px-2.5 py-1 rounded border border-[#4c4546] font-bold">
              Monochrome-Command (#121414)
            </span>
          </div>

        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-3 border-t border-[#4c4546]/40">
          <button 
            onClick={onClose}
            className="px-4 py-2 border border-[#4c4546] text-[#cfc4c5] hover:text-white font-mono text-xs rounded uppercase"
          >
            Close
          </button>
          <button 
            onClick={handleSave}
            className="px-5 py-2 bg-[#c7c6c6] hover:bg-white text-black font-mono font-bold text-xs rounded uppercase transition-colors flex items-center gap-1.5 shadow"
          >
            {savedSuccess ? <Check className="w-4 h-4 text-emerald-600" /> : null}
            {savedSuccess ? 'Saved' : 'Apply Settings'}
          </button>
        </div>

      </div>
    </div>
  );
};
