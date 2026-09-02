/// <reference types="vite/client" />
import { AnalyticsData, AlertItem, CameraFeed, DetectionLog, WatchlistItem } from './types';

export const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
export interface VideoSource { id: string; filename: string; display_name: string; latitude?: number; longitude?: number; }
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, init);
  if (!response.ok) {
    let detail = response.statusText;
    try { detail = (await response.json()).detail || detail; } catch { /* plain response */ }
    throw new Error(`${response.status} — ${detail}`);
  }
  return response.json();
}
export const getJob = (id: string) => api<any>(`/api/jobs/${encodeURIComponent(id)}`);
export const getResult = (id: string) => api<any>(`/api/results?job_id=${encodeURIComponent(id)}`);
export const getWatchlist = () => api<WatchlistItem[]>('/api/watchlist');
export const addWatchlist = (item: Pick<WatchlistItem, 'plate' | 'category' | 'notes'>) => api<WatchlistItem>('/api/watchlist', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(item) });
export const deleteWatchlist = (plate: string) => api(`/api/watchlist/${encodeURIComponent(plate)}`, { method: 'DELETE' });
export const startProcess = (videoName?: string, file?: File) => { const body = new FormData(); if (file) body.append('video', file); else body.append('video_name', videoName || ''); return api<any>('/api/process', { method: 'POST', body }); };

export function mapResult(result: any) {
  const events = result.events || [];
  const cameraFeeds: CameraFeed[] = (result.cameras || []).map((c: any) => ({ id: c.camera_id, name: c.camera_name, location: c.location || 'Configured camera', streamType: 'offline', status: 'offline', fps: 0, resolution: 'N/A', trafficFlow: 'OFFLINE SOURCE', incidents: 0, detections: [], videoUrl: c.source ? `${API_BASE}/api/source/${encodeURIComponent(c.source)}` : undefined }));
  const detectionLogs: DetectionLog[] = events.map((e: any, i: number) => ({ id: `${e.global_vehicle_id || 'event'}-${i}`, plate: e.normalized_plate || 'UNKNOWN', timestamp: `${Number(e.timestamp || 0).toFixed(2)}s`, camera: e.camera_id, confidence: Number(e.ocr_confidence || e.plate_confidence || 0) * 100, vehicleClass: e.vehicle_class, direction: e.direction, isAlert: false }));
  const alerts: AlertItem[] = (result.alerts || []).map((a: any, i: number) => ({ id: `alert-${i}-${a.plate || a.global_vehicle_id}`, title: a.alert_type === 'BLACKLIST' ? 'Blacklist Match' : 'Route Anomaly', type: a.alert_type === 'BLACKLIST' ? 'hotlist' : 'suspicious', plate: a.plate || 'UNKNOWN', timestamp: `${Number(a.timestamp || 0).toFixed(2)}s`, sector: a.camera_id || a.from_camera || 'Configured camera', confidence: Number(a.confidence || 0) * 100, snapshotUrl: '', minimapUrl: '', status: 'active', lat: Number(a.latitude || 0), lng: Number(a.longitude || 0), notes: a.reason }));
  return { cameraFeeds, detectionLogs, alerts, analytics: result.analytics || {}, events };
}
