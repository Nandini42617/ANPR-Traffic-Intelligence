import React from 'react';
import { ScreenView } from '../types';
import { 
  LayoutDashboard, 
  Milestone, 
  BarChart3, 
  AlertTriangle, 
  Settings, 
  HelpCircle, 
  Radar 
} from 'lucide-react';

interface SideNavBarProps {
  currentScreen: ScreenView;
  onNavigate: (screen: ScreenView) => void;
  activeAlertsCount: number;
  onOpenSettings: () => void;
  onOpenSupport: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const SideNavBar: React.FC<SideNavBarProps> = ({
  currentScreen,
  onNavigate,
  activeAlertsCount,
  onOpenSettings,
  onOpenSupport,
  isMobileOpen = false,
  onCloseMobile
}) => {
  const handleNavClick = (screen: ScreenView) => {
    onNavigate(screen);
    if (onCloseMobile) onCloseMobile();
  };

  const navContent = (
    <div className="flex flex-col h-full font-mono uppercase tracking-widest text-xs">
      {/* Active Ops Sub-Header */}
      <div className="px-6 py-5 border-b border-[#4c4546]/30 flex items-center gap-3.5 bg-[#121414]/50">
        <div className="w-10 h-10 rounded bg-[#292a2a] flex items-center justify-center border border-[#4c4546]/50 shadow-inner shrink-0">
          <Radar className="w-5 h-5 text-[#c7c6c6] animate-spin" style={{ animationDuration: '8s' }} />
        </div>
        <div className="overflow-hidden">
          <h2 className="font-sans font-bold text-base text-[#e3e2e2] leading-tight normal-case truncate">VigilantFlow</h2>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <p className="text-[10px] text-[#988e90] tracking-widest font-mono">ACTIVE OPS</p>
          </div>
        </div>
      </div>

      {/* Main Navigation Links */}
      <div className="flex-1 py-4 flex flex-col gap-1 overflow-y-auto">
        {/* Dashboard */}
        <button
          id="sidenav-dashboard"
          onClick={() => handleNavClick('dashboard')}
          className={`flex items-center gap-4 px-6 py-4 transition-all duration-200 text-left w-full cursor-pointer ${
            currentScreen === 'dashboard'
              ? 'bg-[#c7c6c6]/10 text-white border-r-4 border-[#c7c6c6] font-bold shadow-sm'
              : 'text-[#cfc4c5] hover:bg-[#292a2a]/60 hover:text-white'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 shrink-0 text-[#c7c6c6]" />
          <span>Dashboard</span>
        </button>

        {/* Trajectory */}
        <button
          id="sidenav-trajectory"
          onClick={() => handleNavClick('trajectory')}
          className={`flex items-center gap-4 px-6 py-4 transition-all duration-200 text-left w-full cursor-pointer ${
            currentScreen === 'trajectory'
              ? 'bg-[#c7c6c6]/10 text-white border-r-4 border-[#c7c6c6] font-bold shadow-sm'
              : 'text-[#cfc4c5] hover:bg-[#292a2a]/60 hover:text-white'
          }`}
        >
          <Milestone className="w-5 h-5 shrink-0 text-[#c7c6c6]" />
          <span>Trajectory</span>
        </button>

        {/* Analytics */}
        <button
          id="sidenav-analytics"
          onClick={() => handleNavClick('analytics')}
          className={`flex items-center gap-4 px-6 py-4 transition-all duration-200 text-left w-full cursor-pointer ${
            currentScreen === 'analytics'
              ? 'bg-[#c7c6c6]/10 text-white border-r-4 border-[#c7c6c6] font-bold shadow-sm'
              : 'text-[#cfc4c5] hover:bg-[#292a2a]/60 hover:text-white'
          }`}
        >
          <BarChart3 className="w-5 h-5 shrink-0 text-[#c7c6c6]" />
          <span>Analytics</span>
        </button>

        {/* Alerts */}
        <button
          id="sidenav-alerts"
          onClick={() => handleNavClick('alerts')}
          className={`flex items-center justify-between px-6 py-4 transition-all duration-200 text-left w-full cursor-pointer group ${
            currentScreen === 'alerts'
              ? 'bg-[#c7c6c6]/10 text-white border-r-4 border-[#c7c6c6] font-bold shadow-sm'
              : 'text-[#cfc4c5] hover:bg-[#292a2a]/60 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-4">
            <AlertTriangle className="w-5 h-5 shrink-0 text-[#ffb4ab]" />
            <span>Alerts</span>
          </div>
          {activeAlertsCount > 0 && (
            <span className="bg-[#ffb4ab]/20 text-[#ffb4ab] border border-[#ffb4ab]/40 px-2 py-0.5 rounded text-[11px] font-bold group-hover:bg-[#ffb4ab]/30 transition-colors">
              {activeAlertsCount}
            </span>
          )}
        </button>
      </div>

      {/* System Status Pill in Nav */}
      <div className="px-6 py-3 bg-[#121414]/40 border-t border-b border-[#4c4546]/20">
        <div className="flex items-center justify-between text-[10px] text-[#988e90]">
          <span>ANPR Engine</span>
          <span className="text-[#4cd7f6] font-bold">API STATUS</span>
        </div>
        <div className="w-full bg-[#292a2a] h-1.5 rounded-full mt-1.5 overflow-hidden">
          <div className="bg-[#4cd7f6] h-full rounded-full" style={{ width: '100%' }}></div>
        </div>
      </div>

      {/* Settings & Support */}
      <div className="border-t border-[#4c4546]/30 py-3 flex flex-col gap-1">
        <button
          id="sidenav-settings"
          onClick={() => {
            onOpenSettings();
            if (onCloseMobile) onCloseMobile();
          }}
          className="text-[#cfc4c5] flex items-center gap-4 px-6 py-3 hover:bg-[#292a2a]/60 hover:text-white transition-all duration-200 text-left w-full cursor-pointer text-[11px]"
        >
          <Settings className="w-4 h-4 shrink-0 text-[#988e90]" />
          <span>Settings</span>
        </button>
        <button
          id="sidenav-support"
          onClick={() => {
            onOpenSupport();
            if (onCloseMobile) onCloseMobile();
          }}
          className="text-[#cfc4c5] flex items-center gap-4 px-6 py-3 hover:bg-[#292a2a]/60 hover:text-white transition-all duration-200 text-left w-full cursor-pointer text-[11px]"
        >
          <HelpCircle className="w-4 h-4 shrink-0 text-[#988e90]" />
          <span>Support & Docs</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside 
        id="side-nav-bar"
        className="hidden md:flex flex-col fixed left-0 top-16 h-[calc(100vh-64px)] z-40 w-64 bg-[#1f2020]/95 backdrop-blur-lg shadow-2xl border-r border-[#4c4546]/30 transition-all duration-300 ease-in-out"
      >
        {navContent}
      </aside>

      {/* Mobile Slide-Over Drawer with Backdrop */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            onClick={onCloseMobile}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <aside 
            id="mobile-drawer-side-nav"
            className="relative z-50 w-72 max-w-[85vw] h-full bg-[#1b1c1c] border-r border-[#4c4546] shadow-2xl flex flex-col pt-2"
          >
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
};
