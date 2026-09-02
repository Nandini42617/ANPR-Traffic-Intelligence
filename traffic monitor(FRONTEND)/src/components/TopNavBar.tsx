import React, { useState, useEffect } from 'react';
import { ScreenView } from '../types';
import { api } from '../api';
import { ASSETS } from '../data/mockData';
import { 
  Search, 
  BarChart2, 
  Radio, 
  Server, 
  Shield, 
  Bell, 
  X, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';

interface TopNavBarProps {
  currentScreen: ScreenView;
  onNavigate: (screen: ScreenView) => void;
  onSearchSelectPlate: (plate: string) => void;
  activeAlertsCount: number;
  onOpenSettings: () => void;
  onOpenSupport: () => void;
  onToggleMobileNav?: () => void;
  isMobileNavOpen?: boolean;
  searchItems?: Array<{ plate: string; desc: string; type: string }>;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  currentScreen,
  onNavigate,
  onSearchSelectPlate,
  activeAlertsCount,
  onOpenSettings,
  onOpenSupport,
  onToggleMobileNav,
  isMobileNavOpen,
  searchItems = []
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSensorsMenu, setShowSensorsMenu] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [remoteResults, setRemoteResults] = useState<Array<{ plate: string; desc: string; type: string }>>([]);

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      const h = String(d.getHours()).padStart(2, '0');
      const m = String(d.getMinutes()).padStart(2, '0');
      const s = String(d.getSeconds()).padStart(2, '0');
      setCurrentTime(`${h}:${m}:${s}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) { setRemoteResults([]); return; }
    const timer = setTimeout(() => api<any[]>(`/api/search/${encodeURIComponent(searchQuery.trim())}`).then(rows => setRemoteResults(rows.map(row => ({ plate: row.normalized_plate || row.global_vehicle_id || row.camera_id, desc: `Processed ANPR event · ${row.camera_id || 'camera'}`, type: 'trajectory' })))).catch(() => setRemoteResults([])), 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const samplePlates = searchItems;

  const searchOptions = remoteResults.length ? remoteResults : samplePlates;
  const filteredPlates = searchQuery.trim()
    ? searchOptions.filter(p => 
        p.plate.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.desc.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : searchOptions;

  const handleSelectSearch = (item: typeof samplePlates[0]) => {
    if (item.type === 'trajectory' || item.type === 'detection' || item.plate.startsWith('NY')) {
      onSearchSelectPlate(item.plate);
      onNavigate('trajectory');
    } else if (item.type === 'alert') {
      onSearchSelectPlate(item.plate);
      onNavigate('alerts');
    } else {
      onNavigate('dashboard');
    }
    setShowSearchDropdown(false);
    setShowMobileSearch(false);
    setSearchQuery('');
  };

  return (
    <header className="fixed top-0 w-full z-50 flex items-center justify-between px-3 sm:px-6 h-16 bg-[#1f2020]/95 backdrop-blur-xl border-b border-[#4c4546]/40 shadow-lg text-[#c7c6c6]">
      {/* Brand & Mobile Menu Toggle */}
      <div className="flex items-center gap-2 sm:gap-4 lg:gap-6">
        {/* Mobile Hamburger Menu Toggle */}
        <button
          id="mobile-nav-toggle-btn"
          onClick={onToggleMobileNav}
          className="md:hidden p-2 rounded-lg bg-[#292a2a] text-[#cfc4c5] hover:text-white border border-[#4c4546]/50 cursor-pointer active:scale-95 transition-all"
          aria-label="Toggle navigation drawer"
        >
          <span className="material-symbols-outlined text-lg leading-none">
            {isMobileNavOpen ? 'close' : 'menu'}
          </span>
        </button>

        <div 
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2 sm:gap-2.5 cursor-pointer group"
          id="brand-logo"
        >
          <div className="w-8 h-8 rounded bg-[#343535] flex items-center justify-center border border-[#988e90]/40 group-hover:border-[#c7c6c6] transition-colors shrink-0">
            <span className="material-symbols-outlined text-[#e3e2e2] text-lg">radar</span>
          </div>
          <span className="font-bold text-base sm:text-xl lg:text-2xl text-[#e3e2e2] tracking-tight group-hover:text-white transition-colors truncate max-w-[150px] sm:max-w-none">
            VigilantFlow <span className="text-[#4cd7f6] text-xs font-mono uppercase tracking-widest hidden xs:inline">AI</span>
          </span>
        </div>

        {/* In-header Navigation Tabs (Desktop quick switching) */}
        <div className="hidden lg:flex items-center space-x-1 ml-2 bg-[#121414]/60 p-1 rounded border border-[#4c4546]/30">
          <button 
            id="nav-tab-dashboard"
            onClick={() => onNavigate('dashboard')}
            className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded transition-all ${
              currentScreen === 'dashboard' 
                ? 'bg-[#343535] text-white shadow-sm border border-[#988e90]/30' 
                : 'text-[#cfc4c5] hover:text-white hover:bg-[#292a2a]'
            }`}
          >
            Dashboard
          </button>
          <button 
            id="nav-tab-trajectory"
            onClick={() => onNavigate('trajectory')}
            className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded transition-all ${
              currentScreen === 'trajectory' 
                ? 'bg-[#343535] text-white shadow-sm border border-[#988e90]/30' 
                : 'text-[#cfc4c5] hover:text-white hover:bg-[#292a2a]'
            }`}
          >
            Trajectory
          </button>
          <button 
            id="nav-tab-analytics"
            onClick={() => onNavigate('analytics')}
            className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded transition-all ${
              currentScreen === 'analytics' 
                ? 'bg-[#343535] text-white shadow-sm border border-[#988e90]/30' 
                : 'text-[#cfc4c5] hover:text-white hover:bg-[#292a2a]'
            }`}
          >
            Analytics
          </button>
          <button 
            id="nav-tab-alerts"
            onClick={() => onNavigate('alerts')}
            className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded transition-all flex items-center gap-1.5 ${
              currentScreen === 'alerts' 
                ? 'bg-[#343535] text-white shadow-sm border border-[#988e90]/30' 
                : 'text-[#cfc4c5] hover:text-white hover:bg-[#292a2a]'
            }`}
          >
            Alerts
            {activeAlertsCount > 0 && (
              <span className="bg-[#ffb4ab]/20 text-[#ffb4ab] px-1.5 py-0.2 rounded text-[10px] font-bold border border-[#ffb4ab]/40">
                {activeAlertsCount}
              </span>
            )}
          </button>
        </div>

        {/* Global Plate & Sector Search (Desktop) */}
        <div className="relative hidden md:block w-56 lg:w-72">
          <div className="flex items-center bg-[#292a2a] rounded-full px-3.5 py-1.5 border border-[#4c4546]/60 focus-within:border-[#c7c6c6] focus-within:ring-1 focus-within:ring-[#c7c6c6]/50 transition-all">
            <Search className="w-4 h-4 text-[#988e90] mr-2 shrink-0" />
            <input 
              id="global-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchDropdown(true);
              }}
              onFocus={() => setShowSearchDropdown(true)}
              placeholder="Search plates, locations..."
              className="bg-transparent border-none outline-none text-xs sm:text-sm text-[#e3e2e2] w-full placeholder-[#cfc4c5]/60 focus:ring-0 p-0 font-mono"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-[#988e90] hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Search Dropdown */}
          {showSearchDropdown && (
            <div className="absolute left-0 top-full mt-2 w-80 bg-[#1b1c1c] border border-[#4c4546] rounded-lg shadow-2xl p-2 z-50">
              <div className="flex justify-between items-center px-2 py-1 border-b border-[#4c4546]/40 text-[10px] text-[#988e90] uppercase tracking-wider font-mono">
                <span>Direct Search Jump</span>
                <button onClick={() => setShowSearchDropdown(false)} className="hover:text-white">Close</button>
              </div>
              <div className="max-h-60 overflow-y-auto mt-1 space-y-1">
                {filteredPlates.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectSearch(item)}
                    className="p-2 rounded bg-[#292a2a]/60 hover:bg-[#343535] cursor-pointer flex items-center justify-between transition-colors border border-transparent hover:border-[#988e90]/30"
                  >
                    <div>
                      <span className="font-mono font-bold text-xs text-white bg-black/40 px-1.5 py-0.5 rounded border border-[#4c4546]">
                        {item.plate}
                      </span>
                      <p className="text-[11px] text-[#cfc4c5] mt-0.5">{item.desc}</p>
                    </div>
                    <span className="text-[10px] font-mono uppercase text-[#988e90] bg-[#121414] px-1.5 py-0.5 rounded">
                      {item.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Controls & Profile */}
      <div className="flex items-center gap-1.5 sm:gap-3">
        {/* Mobile Search Toggle Button */}
        <button
          id="mobile-search-btn"
          onClick={() => setShowMobileSearch(!showMobileSearch)}
          className="md:hidden p-2 rounded-full hover:bg-[#343535] text-[#cfc4c5] hover:text-white transition-colors"
          title="Search Plates"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Analytics Shortcut */}
        <button 
          id="top-analytics-btn"
          onClick={() => onNavigate('analytics')}
          title="Macro Flow Analytics"
          className="p-2 rounded-full hover:bg-[#343535] transition-colors text-[#cfc4c5] hover:text-white cursor-pointer active:scale-95 duration-150"
        >
          <BarChart2 className="w-5 h-5" />
        </button>

        {/* Live Sensors Diagnostic */}
        <div className="relative">
          <button 
            id="top-sensors-btn"
            onClick={() => setShowSensorsMenu(!showSensorsMenu)}
            title="Sensor Array Diagnostic"
            className="p-2 rounded-full hover:bg-[#343535] transition-colors text-[#cfc4c5] hover:text-white cursor-pointer active:scale-95 duration-150 relative"
          >
            <Radio className="w-5 h-5 text-[#4cd7f6]" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#4cd7f6] rounded-full animate-ping"></span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#4cd7f6] rounded-full"></span>
          </button>

          {showSensorsMenu && (
            <div className="absolute right-0 top-full mt-2 w-72 max-w-[calc(100vw-24px)] bg-[#1b1c1c] border border-[#4c4546] rounded-lg shadow-2xl p-3 z-50 text-xs">
              <div className="flex justify-between items-center border-b border-[#4c4546]/40 pb-2 mb-2">
                <span className="font-bold text-white uppercase tracking-wider text-[11px]">Sensor Network Grid</span>
                <span className="text-[10px] font-mono text-[#4cd7f6]">142 / 143 ACTIVE</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between p-1.5 bg-[#292a2a] rounded">
                  <span className="text-[#e3e2e2]">ANPR HD Cameras</span>
                  <span className="text-emerald-400 font-mono flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> 84 Online
                  </span>
                </div>
                <div className="flex items-center justify-between p-1.5 bg-[#292a2a] rounded">
                  <span className="text-[#e3e2e2]">Thermal IR Units</span>
                  <span className="text-emerald-400 font-mono flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> 32 Online
                  </span>
                </div>
                <div className="flex items-center justify-between p-1.5 bg-[#292a2a] rounded">
                  <span className="text-[#e3e2e2]">Toll Plaza Radars</span>
                  <span className="text-emerald-400 font-mono flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> 26 Online
                  </span>
                </div>
                <div className="flex items-center justify-between p-1.5 bg-[#292a2a] rounded">
                  <span className="text-[#e3e2e2]">CAM-08-W (Artery)</span>
                  <span className="text-[#ffb4ab] font-mono flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Reconnecting
                  </span>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowSensorsMenu(false);
                  onOpenSupport();
                }}
                className="w-full mt-2.5 py-1.5 text-center text-[10px] uppercase tracking-wider font-mono text-[#4cd7f6] bg-[#121414] hover:bg-[#292a2a] rounded border border-[#4c4546]/40 font-bold"
              >
                Full Hardware Diagnostics &rarr;
              </button>
            </div>
          )}
        </div>

        {/* Server & Node Status */}
        <button 
          id="top-server-btn"
          onClick={onOpenSupport}
          title="Edge Node Engine"
          className="p-2 rounded-full hover:bg-[#343535] transition-colors text-[#cfc4c5] hover:text-white cursor-pointer active:scale-95 duration-150 hidden xs:flex"
        >
          <Server className="w-5 h-5" />
        </button>

        <div className="h-6 w-px bg-[#4c4546]/50 mx-0.5 sm:mx-1"></div>

        {/* Operator Profile */}
        <div className="relative">
          <div 
            id="operator-profile-btn"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 cursor-pointer p-1 rounded-full hover:bg-[#343535] transition-colors border border-transparent hover:border-[#988e90]/40"
          >
            <img 
              src={ASSETS.operatorAvatar} 
              alt="Chief Operator Profile"
              className="w-8 h-8 rounded-full object-cover border border-[#988e90]/60 hover:border-[#4cd7f6] transition-colors"
            />
          </div>

          {showProfileMenu && (
            <div className="absolute right-0 top-full mt-2 w-64 max-w-[calc(100vw-24px)] bg-[#1b1c1c] border border-[#4c4546] rounded-lg shadow-2xl p-3 z-50">
              <div className="flex items-center gap-3 border-b border-[#4c4546]/40 pb-3 mb-2">
                <img 
                  src={ASSETS.operatorAvatar} 
                  alt="Chief Operator"
                  className="w-10 h-10 rounded-full object-cover border border-[#4cd7f6]"
                />
                <div>
                  <h4 className="font-bold text-white text-sm">Cmdr. V. Vance</h4>
                  <p className="text-[11px] text-[#4cd7f6] font-mono">CHIEF TACTICAL OPERATOR</p>
                  <span className="text-[10px] text-[#988e90] font-mono">SECTOR COMMAND 01</span>
                </div>
              </div>
              <div className="space-y-1 text-xs font-mono">
                <div className="flex justify-between text-[#cfc4c5] py-1 border-b border-[#4c4546]/20">
                  <span>Shift Status:</span>
                  <span className="text-emerald-400 font-bold">ACTIVE OPS</span>
                </div>
                <div className="flex justify-between text-[#cfc4c5] py-1 border-b border-[#4c4546]/20">
                  <span>Local Sync:</span>
                  <span className="text-white">{currentTime}</span>
                </div>
                <div className="flex justify-between text-[#cfc4c5] py-1">
                  <span>Clearance:</span>
                  <span className="text-amber-300 font-bold">LEVEL-5</span>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-[#4c4546]/40 flex gap-2">
                <button 
                  onClick={() => {
                    setShowProfileMenu(false);
                    onOpenSettings();
                  }}
                  className="flex-1 py-1.5 text-center text-[10px] uppercase tracking-wider font-mono text-[#e3e2e2] bg-[#292a2a] hover:bg-[#343535] rounded"
                >
                  Preferences
                </button>
                <button 
                  onClick={() => setShowProfileMenu(false)}
                  className="py-1.5 px-3 text-center text-[10px] uppercase tracking-wider font-mono text-[#ffb4ab] bg-[#93000a]/20 hover:bg-[#93000a]/40 rounded border border-[#ffb4ab]/30"
                >
                  Lock
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Search Overlay Modal */}
      {showMobileSearch && (
        <div className="md:hidden fixed inset-x-0 top-16 bg-[#1b1c1c]/95 border-b border-[#4c4546] p-3 shadow-2xl z-50 backdrop-blur-xl">
          <div className="flex items-center bg-[#121414] rounded-lg px-3 py-2 border border-[#4c4546]">
            <Search className="w-4 h-4 text-[#988e90] mr-2 shrink-0" />
            <input 
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search processed plate or camera..."
              className="bg-transparent border-none outline-none text-sm text-white w-full font-mono placeholder:text-[#988e90]"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-[#988e90] hover:text-white mr-1">
                <X className="w-4 h-4" />
              </button>
            )}
            <button 
              onClick={() => setShowMobileSearch(false)}
              className="text-xs font-mono text-[#4cd7f6] font-bold uppercase ml-2 px-1"
            >
              Cancel
            </button>
          </div>

          <div className="max-h-64 overflow-y-auto mt-2 space-y-1">
            {filteredPlates.map((item, idx) => (
              <div
                key={idx}
                onClick={() => handleSelectSearch(item)}
                className="p-2 rounded bg-[#292a2a]/80 active:bg-[#343535] cursor-pointer flex items-center justify-between border border-[#4c4546]/30"
              >
                <div>
                  <span className="font-mono font-bold text-xs text-white bg-black/40 px-1.5 py-0.5 rounded border border-[#4c4546]">
                    {item.plate}
                  </span>
                  <p className="text-[11px] text-[#cfc4c5] mt-0.5">{item.desc}</p>
                </div>
                <span className="text-[10px] font-mono uppercase text-[#4cd7f6] bg-[#121414] px-1.5 py-0.5 rounded">
                  {item.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};
