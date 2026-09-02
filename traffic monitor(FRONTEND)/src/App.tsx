import React, { useEffect, useState } from 'react';
import { ScreenView, WatchlistItem, AlertItem, CameraFeed } from './types';
import { getJob, getResult, getWatchlist, addWatchlist, deleteWatchlist, mapResult, startProcess, API_BASE, VideoSource, api } from './api';
import { TopNavBar } from './components/TopNavBar';
import { SideNavBar } from './components/SideNavBar';
import { DashboardView } from './components/DashboardView';
import { TrajectoryView } from './components/TrajectoryView';
import { AnalyticsView } from './components/AnalyticsView';
import { AlertsView } from './components/AlertsView';
import { DispatchModal } from './components/DispatchModal';
import { SettingsModal } from './components/SettingsModal';
import { SupportModal } from './components/SupportModal';
import { CameraDetailModal } from './components/CameraDetailModal';

export default function App() {
  const [screen, setScreen] = useState<ScreenView>('dashboard');
  const [jobId, setJobId] = useState(localStorage.getItem('vigilantflow.job') || '');
  const [job, setJob] = useState<any>(null);
  const [data, setData] = useState<any>({ cameraFeeds: [], detectionLogs: [], alerts: [], analytics: {}, events: [] });
  const [sources, setSources] = useState<VideoSource[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [activePlate, setActivePlate] = useState('');
  const [error, setError] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false), [supportOpen, setSupportOpen] = useState(false);
  const [focusedCamera, setFocusedCamera] = useState<CameraFeed | null>(null);
  const [dispatchTarget, setDispatchTarget] = useState<{alert: AlertItem | null; location?: string} | null>(null);
  const loadCompleted = async (id: string) => { const result = await getResult(id); const mapped = mapResult(result); setData(mapped); const first = mapped.events.find((event: any) => event.normalized_plate); if (first) setActivePlate(first.normalized_plate); };
  useEffect(() => { getWatchlist().then(setWatchlist).catch(e => setError(e.message)); api<VideoSource[]>('/api/sources').then(setSources).catch(e => setError(e.message)); if (jobId) getJob(jobId).then(async current => { setJob(current); if (current.status === 'completed') await loadCompleted(jobId); }).catch(() => { localStorage.removeItem('vigilantflow.job'); setJobId(''); }); }, []);
  useEffect(() => { if (!jobId || !job || ['completed', 'failed'].includes(job.status)) return; let cancelled = false; const poll = async () => { try { const next = await getJob(jobId); if (cancelled || next.job_id !== jobId) return; setJob(next); if (next.status === 'completed') await loadCompleted(jobId); else if (next.status !== 'failed') setTimeout(poll, 1200); } catch (e: any) { if (!cancelled) setError(e.message); } }; const timer = setTimeout(poll, 800); return () => { cancelled = true; clearTimeout(timer); }; }, [jobId, job?.status]);
  const begin = async (name?: string, file?: File) => { try { setError(''); setData({ cameraFeeds: [], detectionLogs: [], alerts: [], analytics: {}, events: [] }); const created = await startProcess(name, file); setJobId(created.job_id); localStorage.setItem('vigilantflow.job', created.job_id); setJob(created); } catch (e: any) { setError(e.message); } };
  const selectPlate = (plate: string) => { setActivePlate(plate); setScreen('trajectory'); };
  const add = async (plate: string, category: WatchlistItem['category']) => { try { const item = await addWatchlist({ plate, category, notes: '' }); setWatchlist(items => [item, ...items.filter(x => x.plate !== item.plate)]); } catch (e: any) { setError(e.message); } };
  const remove = async (id: string) => { const item = watchlist.find(x => x.id === id); if (!item) return; await deleteWatchlist(item.plate); setWatchlist(items => items.filter(x => x.id !== id)); };
  const alerts = data.alerts as AlertItem[];
  return <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#121414] text-[#e3e2e2] select-none font-sans">
    <TopNavBar currentScreen={screen} onNavigate={setScreen} onSearchSelectPlate={selectPlate} activeAlertsCount={alerts.length} onOpenSettings={() => setSettingsOpen(true)} onOpenSupport={() => setSupportOpen(true)} />
    <div className="flex flex-1 pt-16 h-full overflow-hidden"><SideNavBar currentScreen={screen} onNavigate={setScreen} activeAlertsCount={alerts.length} onOpenSettings={() => setSettingsOpen(true)} onOpenSupport={() => setSupportOpen(true)} isMobileOpen={false} onCloseMobile={() => {}} />
      <main className="flex-1 md:ml-64 p-2.5 sm:p-4 md:p-6 flex flex-col h-full overflow-y-auto lg:overflow-hidden pb-20 md:pb-10">
        {error && <div className="mb-3 rounded border border-[#ffb4ab]/50 bg-[#93000a]/20 px-3 py-2 text-xs font-mono text-[#ffb4ab]">{error}</div>}
        {job && !['completed', 'failed'].includes(job.status) && <div className="mb-3 rounded border border-[#4cd7f6]/40 bg-[#1b1c1c] px-3 py-2 text-xs font-mono text-[#4cd7f6]">{job.video_name} · {job.status.toUpperCase()} · {job.progress}% ({job.frames_processed || 0}/{job.total_frames || '—'} frames)</div>}
        {screen === 'dashboard' && <DashboardView cameraFeeds={data.cameraFeeds.length ? data.cameraFeeds : sources.map(source => ({ id: source.id, name: source.display_name, location: 'New Delhi configured source', streamType: 'offline' as const, status: 'offline' as const, fps: 0, resolution: 'N/A', trafficFlow: 'OFFLINE SOURCE', incidents: 0, detections: [], videoUrl: `${API_BASE}/api/source/${encodeURIComponent(source.filename)}` }))} detectionLogs={data.detectionLogs} onSelectPlateForTracking={selectPlate} onNavigate={setScreen} activeAlertsCount={alerts.length} onFocusCamera={setFocusedCamera} onToggleCamReconnection={() => {}} isStreamPaused={false} onToggleStreamPause={() => {}} onAddManualDetection={() => {}} onStartProcess={begin} job={job} sources={sources} />}
        {screen === 'trajectory' && <TrajectoryView activePlate={activePlate} onSelectPlate={setActivePlate} onDispatchAlert={plate => setDispatchTarget({ alert: alerts.find(a => a.plate === plate) || null, location: plate })} events={data.events} sources={sources} />}
        {screen === 'analytics' && <AnalyticsView onOpenDeployModal={location => setDispatchTarget({ alert: null, location })} onSelectBottleneckView={() => setScreen('trajectory')} analytics={data.analytics} sources={sources} />}
        {screen === 'alerts' && <AlertsView alerts={alerts} watchlist={watchlist} onArchiveAlert={() => {}} onFalsePositiveAlert={() => {}} onDismissAlert={() => {}} onMonitorAlert={id => { const alert = alerts.find(a => a.id === id); if (alert) selectPlate(alert.plate); }} onOpenDispatchModal={alert => setDispatchTarget({ alert })} onAddWatchlistItem={add} onRemoveWatchlistItem={remove} onSelectPlateForTracking={selectPlate} />}
      </main>
    </div>
    {dispatchTarget && <DispatchModal alert={dispatchTarget.alert} targetLocation={dispatchTarget.location} onClose={() => setDispatchTarget(null)} onConfirmDispatch={() => setDispatchTarget(null)} />}
    {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}{supportOpen && <SupportModal onClose={() => setSupportOpen(false)} />}{focusedCamera && <CameraDetailModal camera={focusedCamera} onClose={() => setFocusedCamera(null)} onSelectPlateForTracking={selectPlate} />}
    {job?.status === 'completed' && job?.completed_result?.video_url && <a className="fixed bottom-9 right-3 z-50 text-[10px] font-mono text-[#4cd7f6]" href={`${API_BASE}${job.completed_result.video_url}`} target="_blank">ANNOTATED VIDEO</a>}
  </div>;
}
