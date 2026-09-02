import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const icon = new L.Icon({ iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png', iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png', shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41] });
function Recenter({ center, zoom }: { center: [number, number]; zoom: number }) { const map = useMap(); React.useEffect(() => { map.setView(center, zoom); }, [map, center, zoom]); return null; }
export const RealMap: React.FC<{ sources: any[]; history: any[] }> = ({ sources, history }) => {
  const points = history.filter(point => point.lat && point.lng).map(point => [point.lat, point.lng] as [number, number]);
  const center: [number, number] = points[points.length - 1] || [28.6139, 77.2090];
  return <MapContainer center={center} zoom={13} className="absolute inset-0 z-0 h-full w-full"><TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /><Recenter center={center} zoom={points.length ? 14 : 13} />{sources.map(source => source.latitude && source.longitude && <Marker key={source.id} position={[source.latitude, source.longitude]} icon={icon}><Popup>{source.display_name}<br />Configured video source</Popup></Marker>)}{points.map((point, i) => <Marker key={`target-${i}`} position={point} icon={icon}><Popup>Target observation {i + 1}</Popup></Marker>)}{points.length > 1 && <Polyline positions={points} pathOptions={{ color: '#4cd7f6', weight: 5 }} />}</MapContainer>;
};
