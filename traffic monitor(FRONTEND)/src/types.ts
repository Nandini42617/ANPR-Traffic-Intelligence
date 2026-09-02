export type ScreenView = 'dashboard' | 'trajectory' | 'analytics' | 'alerts';

export interface BoundingBoxItem {
  id: string;
  label: string;
  confidence: number;
  isAlert?: boolean;
  alertText?: string;
  top: string; // e.g. "45%"
  left: string;
  width: string;
  height: string;
}

export interface CameraFeed {
  id: string;
  name: string;
  location: string;
  streamType: 'rgb' | 'ir' | 'toll' | 'offline';
  status: 'live' | 'reconnecting' | 'offline';
  fps: number;
  resolution: string;
  bgImage?: string;
  speedAvg?: number;
  trafficFlow?: string;
  incidents?: number;
  detections: BoundingBoxItem[];
  videoUrl?: string;
}

export interface DetectionLog {
  id: string;
  plate: string;
  timestamp: string;
  camera: string;
  sector?: string;
  confidence: number;
  isAlert?: boolean;
  alertType?: string;
  watchlistName?: string;
  vehicleClass?: string;
  speedMph?: number;
  direction?: string;
}

export interface TrajectoryPoint {
  id: string;
  timestamp: string;
  cameraName: string;
  sector: string;
  direction: string;
  lat: number;
  lng: number;
  speedMph: number;
  conf: number;
  isLatest?: boolean;
}

export interface TrackedTarget {
  plate: string;
  status: 'TRACKING' | 'LOST' | 'INTERCEPTED';
  totalDistance: string;
  avgSpeed: string;
  lastSeenLocation: string;
  vehicleModel: string;
  color: string;
  alerts: string[];
  history: TrajectoryPoint[];
}

export interface AlertItem {
  id: string;
  title: string;
  type: 'stolen' | 'suspicious' | 'speed' | 'hotlist';
  plate: string;
  timestamp: string;
  sector: string;
  confidence: number;
  snapshotUrl: string;
  minimapUrl: string;
  status: 'active' | 'archived' | 'false_positive' | 'dispatched' | 'dismissed' | 'monitoring';
  assignedUnits?: string[];
  notes?: string;
  lat: number;
  lng: number;
}

export interface WatchlistItem {
  id: string;
  plate: string;
  category: 'STOLEN' | 'POI - SURVEILLANCE' | 'EXPIRED REG' | 'TRAFFIC VIOLATOR' | 'CUSTOM';
  addedAt: string;
  priority: 'high' | 'medium' | 'low';
  notes?: string;
}

export interface DispatchUnit {
  id: string;
  name: string;
  type: 'Patrol Car' | 'Interceptor' | 'Drone Unit' | 'Motorcycle' | 'Helicopter';
  status: 'Available' | 'En Route' | 'On Scene';
  etaMinutes: number;
  sector: string;
}

export interface BottleneckItem {
  id: string;
  location: string;
  flowRate: number;
  severity: 'Critical' | 'Moderate' | 'Low';
  trend: 'increasing' | 'stable' | 'decreasing';
  actionLabel: 'Deploy' | 'View';
}

export interface AnalyticsData { [key: string]: any; }
