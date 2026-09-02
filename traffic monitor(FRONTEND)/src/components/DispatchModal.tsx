import React, { useState } from 'react';
import { AlertItem, DispatchUnit } from '../types';
import { AVAILABLE_DISPATCH_UNITS } from '../data/mockData';
import { 
  Send, 
  X, 
  ShieldAlert, 
  Radio, 
  Clock, 
  CheckCircle2, 
  Navigation,
  Car,
  AlertTriangle
} from 'lucide-react';

interface DispatchModalProps {
  alert: AlertItem | null;
  targetLocation?: string;
  onClose: () => void;
  onConfirmDispatch: (unitIds: string[], notes: string) => void;
}

export const DispatchModal: React.FC<DispatchModalProps> = ({
  alert,
  targetLocation,
  onClose,
  onConfirmDispatch
}) => {
  const [selectedUnits, setSelectedUnits] = useState<string[]>(['unit-1', 'unit-2']);
  const [dispatchNotes, setDispatchNotes] = useState<string>('Intercept target vehicle at highway exit ramp 7B. Maintain visual surveillance.');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<boolean>(false);

  const toggleUnit = (id: string) => {
    setSelectedUnits(prev => 
      prev.includes(id) ? prev.filter(u => u !== id) : [...prev, id]
    );
  };

  const handleDispatch = () => {
    if (selectedUnits.length === 0) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSuccessMessage(true);
      setTimeout(() => {
        onConfirmDispatch(selectedUnits, dispatchNotes);
        onClose();
      }, 1200);
    }, 800);
  };

  const locationTitle = alert ? `${alert.sector} (${alert.plate})` : targetLocation || 'Configured camera location';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#1b1c1c] border border-[#ffb4ab]/50 rounded-xl max-w-xl w-full p-6 shadow-2xl relative flex flex-col gap-4">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b border-[#4c4546]/40 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#93000a] text-[#ffb4ab] flex items-center justify-center border border-[#ffb4ab]/40 animate-pulse">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-sans font-bold text-lg text-white">Tactical Unit Dispatch Authorization</h3>
              <p className="font-mono text-xs text-[#ffb4ab]">Target: {locationTitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#988e90] hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {successMessage ? (
          <div className="py-8 text-center flex flex-col items-center justify-center gap-3">
            <CheckCircle2 className="w-14 h-14 text-emerald-400 animate-bounce" />
            <h4 className="font-bold text-lg text-white font-mono">UNITS DISPATCHED EN ROUTE</h4>
            <p className="text-xs font-mono text-[#cfc4c5]">Encrypted radio dispatch transmitted on Tac-Channel 4.</p>
          </div>
        ) : (
          <>
            {/* Units Selection List */}
            <div>
              <label className="font-mono text-xs text-[#988e90] uppercase tracking-wider block mb-2 font-bold">
                Select Available Sector Response Units
              </label>
              <div className="space-y-2">
                {AVAILABLE_DISPATCH_UNITS.map((unit) => {
                  const isSelected = selectedUnits.includes(unit.id);

                  return (
                    <div
                      key={unit.id}
                      onClick={() => toggleUnit(unit.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                        isSelected 
                          ? 'bg-[#93000a]/20 border-[#ffb4ab] text-white' 
                          : 'bg-[#292a2a]/40 border-[#4c4546]/40 text-[#cfc4c5] hover:bg-[#292a2a]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded flex items-center justify-center ${isSelected ? 'bg-[#ffb4ab] text-black' : 'bg-[#121414] text-[#988e90]'}`}>
                          <Car className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-mono font-bold text-xs">{unit.name}</div>
                          <div className="font-mono text-[10px] text-[#988e90]">{unit.type} • {unit.sector}</div>
                        </div>
                      </div>

                      <div className="text-right font-mono text-xs">
                        <span className="text-emerald-400 font-bold">ETA: ~{unit.etaMinutes} mins</span>
                        <div className="text-[10px] text-[#988e90]">{isSelected ? 'SELECTED' : 'AVAILABLE'}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tactical Notes */}
            <div>
              <label className="font-mono text-xs text-[#988e90] uppercase tracking-wider block mb-1 font-bold">
                Operational Directives & Radio Notes
              </label>
              <textarea 
                value={dispatchNotes}
                onChange={(e) => setDispatchNotes(e.target.value)}
                rows={2}
                className="w-full bg-[#121414] border border-[#4c4546] text-white rounded p-2.5 text-xs font-mono focus:outline-none focus:border-[#ffb4ab]"
              />
            </div>

            {/* Footer Actions */}
            <div className="flex justify-end gap-3 pt-2 border-t border-[#4c4546]/40">
              <button 
                onClick={onClose}
                className="px-4 py-2 border border-[#4c4546] text-[#cfc4c5] hover:text-white font-mono text-xs rounded uppercase tracking-wider"
              >
                Cancel
              </button>
              <button 
                disabled={isSubmitting || selectedUnits.length === 0}
                onClick={handleDispatch}
                className="px-6 py-2 bg-[#93000a] hover:bg-[#93000a]/80 disabled:opacity-50 text-[#ffdad6] font-mono text-xs rounded uppercase tracking-wider font-bold flex items-center gap-2 border border-[#ffb4ab]/40 shadow-lg"
              >
                <Send className="w-4 h-4 text-[#ffb4ab]" />
                {isSubmitting ? 'Transmitting Code 3...' : `Authorize & Dispatch (${selectedUnits.length})`}
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
};
