import React from 'react';
import { X, HelpCircle, CheckCircle2, ShieldCheck, Cpu, HardDrive, Terminal, ExternalLink } from 'lucide-react';

interface SupportModalProps {
  onClose: () => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#1b1c1c] border border-[#4c4546] rounded-xl max-w-2xl w-full p-6 shadow-2xl relative flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-[#4c4546]/40 pb-3">
          <div className="flex items-center gap-2.5">
            <HelpCircle className="w-5 h-5 text-[#4cd7f6]" />
            <div>
              <h3 className="font-sans font-bold text-lg text-white">System Diagnostics & Operations Guide</h3>
              <p className="font-mono text-[11px] text-[#988e90]">VigilantFlow AI Core v2.4.1-stable</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#988e90] hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* System Diagnostics Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-[#121414] p-3 rounded-lg border border-[#4c4546]/40">
            <span className="font-mono text-[10px] text-[#988e90] uppercase block">AI Inference Latency</span>
            <div className="flex items-center gap-2 mt-1">
              <Cpu className="w-4 h-4 text-[#4cd7f6]" />
              <span className="font-mono text-base font-bold text-white">12.4 ms / frame</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400">TensorRT v10.2 Edge</span>
          </div>

          <div className="bg-[#121414] p-3 rounded-lg border border-[#4c4546]/40">
            <span className="font-mono text-[10px] text-[#988e90] uppercase block">ANPR Plate Precision</span>
            <div className="flex items-center gap-2 mt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="font-mono text-base font-bold text-white">99.1% F1-Score</span>
            </div>
            <span className="text-[10px] font-mono text-[#988e90]">LPR DeepNet v4</span>
          </div>

          <div className="bg-[#121414] p-3 rounded-lg border border-[#4c4546]/40">
            <span className="font-mono text-[10px] text-[#988e90] uppercase block">Edge Buffer Status</span>
            <div className="flex items-center gap-2 mt-1">
              <HardDrive className="w-4 h-4 text-[#c7c6c6]" />
              <span className="font-mono text-base font-bold text-white">API HEALTH CHECK</span>
            </div>
            <span className="text-[10px] font-mono text-[#988e90]">14.2 GB / 128 GB</span>
          </div>
        </div>

        {/* Tactical User Guide */}
        <div className="space-y-3">
          <h4 className="font-mono text-xs text-[#e3e2e2] uppercase font-bold tracking-wider">
            Operator Quick Command Reference
          </h4>
          
          <div className="space-y-2 text-xs font-mono">
            <div className="p-2.5 bg-[#121414] rounded border border-[#4c4546]/40">
              <strong className="text-[#4cd7f6]">1. Live Tactical Dashboard:</strong>
              <p className="text-[#cfc4c5] mt-0.5">
                Inspect real-time camera nodes, watch dynamic bounding boxes detect plates, and use the search bar to jump to any vehicle plate directly.
              </p>
            </div>

            <div className="p-2.5 bg-[#121414] rounded border border-[#4c4546]/40">
              <strong className="text-[#4cd7f6]">2. Trajectory Tracking:</strong>
              <p className="text-[#cfc4c5] mt-0.5">
                Track historic timestamped checkpoints on the high-contrast GIS map. Click 'Replay Path' to see chronological vehicle progression with speed telemetry.
              </p>
            </div>

            <div className="p-2.5 bg-[#121414] rounded border border-[#4c4546]/40">
              <strong className="text-[#4cd7f6]">3. Macro Flow & Analytics:</strong>
              <p className="text-[#cfc4c5] mt-0.5">
                Analyze city-wide vehicle class breakdowns (Commuter, Commercial, Emergency), peak hour congestion trends, and deploy traffic mitigation units to bottleneck hot spots.
              </p>
            </div>

            <div className="p-2.5 bg-[#121414] rounded border border-[#4c4546]/40">
              <strong className="text-[#4cd7f6]">4. Real-Time Alerts & Watchlists:</strong>
              <p className="text-[#cfc4c5] mt-0.5">
                Review flagged stolen vehicles with ANPR snapshots and tactical minimaps. Dispatch patrol cars or drone units with one-click authorization.
              </p>
            </div>
          </div>
        </div>

        {/* Terminal Log */}
        <div className="bg-black p-3 rounded-lg border border-[#4c4546]/60 font-mono text-[11px] text-emerald-400 space-y-0.5">
          <div className="text-[#988e90]">// System Boot & Health Trace:</div>
          <div>[SYSTEM] Ingress node cluster verified: 142 cameras active.</div>
          <div>[ANPR] Model weights verified (SHA-256: d8f49a... OK)</div>
          <div>[TELEMETRY] Artery flow pipeline streaming at 60Hz.</div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-[#4c4546]/40">
          <button 
            onClick={onClose}
            className="px-5 py-2 bg-[#292a2a] hover:bg-[#343535] text-white font-mono text-xs rounded uppercase tracking-wider border border-[#4c4546]"
          >
            Close Diagnostics
          </button>
        </div>

      </div>
    </div>
  );
};
