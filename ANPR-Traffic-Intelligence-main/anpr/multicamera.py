"""Central multi-camera event, trajectory, analytics, and alert layer."""
from __future__ import annotations
import json, math
from collections import Counter
from dataclasses import asdict, dataclass
from pathlib import Path
import pandas as pd
from .ocr import normalize_text

@dataclass(frozen=True)
class Camera:
    camera_id: str
    camera_name: str
    latitude: float | None = None
    longitude: float | None = None
    location: str = ""
    direction: str = ""
    source: str = ""
    road_name: str = ""

@dataclass(frozen=True)
class VehicleEvent:
    global_vehicle_id: str
    camera_id: str
    local_track_id: str
    timestamp: float | None
    first_seen: float | None
    last_seen: float | None
    vehicle_class: str
    recognized_plate: str
    normalized_plate: str
    ocr_confidence: float
    plate_confidence: float
    plate_bbox: object
    source_frame: int
    latitude: float | None
    longitude: float | None
    direction: str
    status: str

@dataclass(frozen=True)
class TrajectoryEvent:
    global_vehicle_id: str
    camera_id: str
    timestamp: float | None
    distance_to_next_km: float | None = None
    estimated_speed_kmh: float | None = None
    distance_type: str = "Unavailable"

@dataclass(frozen=True)
class GlobalVehicle:
    global_vehicle_id: str
    normalized_plate: str
    event_count: int
    first_seen: float | None
    last_seen: float | None

@dataclass(frozen=True)
class Alert:
    alert_type: str
    global_vehicle_id: str
    camera_id: str = ""
    timestamp: float | None = None
    confidence: float = 0.0
    reason: str = ""

def load_cameras(path: str | Path) -> list[Camera]:
    path = Path(path)
    if not path.exists(): return []
    data = json.loads(path.read_text(encoding="utf-8"))
    return [Camera(camera_id=str(x["camera_id"]), camera_name=str(x.get("camera_name", x["camera_id"])), latitude=x.get("latitude"), longitude=x.get("longitude"), location=str(x.get("location", "")), direction=str(x.get("direction", "")), source=str(x.get("source", "")), road_name=str(x.get("road_name", ""))) for x in data.get("cameras", [])]

def camera_for_source(source: str, cameras: list[Camera], index: int = 0) -> Camera:
    name = Path(source).name.lower()
    for camera in cameras:
        if camera.source and Path(camera.source).name.lower() == name: return camera
    if index < len(cameras): return cameras[index]
    return Camera(f"cam_{index + 1}", Path(source).stem, location="Unconfigured source")

def build_events(results, cameras: list[Camera]) -> pd.DataFrame:
    rows = []
    for index, result in enumerate(results):
        camera = camera_for_source(result.input_video, cameras, index)
        for record in result.records or []:
            plate = normalize_text(record.recognized_plate)
            if plate == "UNKNOWN": plate = ""
            gid = record.global_vehicle_id or (f"GV-{plate}" if plate and plate != "UNKNOWN" else f"{camera.camera_id}-{record.vehicle_id}")
            rows.append(asdict(VehicleEvent(gid, camera.camera_id, record.vehicle_id, record.first_seen, record.first_seen, record.last_seen, record.vehicle_class, record.recognized_plate, plate, record.ocr_confidence, record.plate_confidence, record.plate_bbox, record.best_frame, camera.latitude, camera.longitude, camera.direction, record.status)))
    return pd.DataFrame(rows)

def trajectory_frame(events: pd.DataFrame, query: str) -> pd.DataFrame:
    if events.empty: return events.copy()
    target = normalize_text(query)
    subset = events[(events.normalized_plate == target) | (events.global_vehicle_id == query)].copy()
    if subset.empty: return subset
    subset = subset.sort_values(["timestamp", "camera_id"], na_position="last").drop_duplicates(["global_vehicle_id", "camera_id"], keep="first")
    subset["time_to_next_s"] = subset.timestamp.shift(-1) - subset.timestamp
    subset["distance_to_next_km"] = None; subset["estimated_speed_kmh"] = None; subset["distance_type"] = "Unavailable"
    values = subset.to_dict("records")
    for i in range(len(values) - 1):
        a, b = values[i], values[i + 1]
        if None not in (a.get("latitude"), a.get("longitude"), b.get("latitude"), b.get("longitude")):
            distance = haversine_km(a["latitude"], a["longitude"], b["latitude"], b["longitude"])
            values[i]["distance_to_next_km"] = round(distance, 3); values[i]["distance_type"] = "Straight-line/geodesic"
            if a.get("time_to_next_s") and a["time_to_next_s"] > 0: values[i]["estimated_speed_kmh"] = round(distance / a["time_to_next_s"] * 3600, 1)
    return pd.DataFrame(values)

def haversine_km(lat1, lon1, lat2, lon2):
    radius = 6371.0088; p1, p2 = math.radians(float(lat1)), math.radians(float(lat2)); dp = math.radians(float(lat2)-float(lat1)); dl = math.radians(float(lon2)-float(lon1))
    return radius * 2 * math.asin(math.sqrt(math.sin(dp/2)**2 + math.cos(p1)*math.cos(p2)*math.sin(dl/2)**2))

def analytics(events: pd.DataFrame) -> dict:
    if events.empty: return {"total_unique_vehicles": 0, "total_observations": 0, "by_class": {}, "by_camera": {}, "plate_recognized": 0, "plate_unreadable": 0, "hourly": pd.DataFrame(), "od": pd.DataFrame(), "load": pd.DataFrame()}
    reliable = events[events.normalized_plate != ""]
    by_camera = events.groupby("camera_id").agg(vehicle_observations=("local_track_id", "count"), unique_vehicles=("global_vehicle_id", "nunique"), plate_recognized=("normalized_plate", lambda x: (x != "").sum())).reset_index()
    od_rows = []
    for gid, group in events[events.global_vehicle_id.str.startswith("GV-")].groupby("global_vehicle_id"):
        cams = group.sort_values("timestamp").drop_duplicates("camera_id").camera_id.tolist()
        od_rows.extend({"origin_camera": a, "destination_camera": b, "vehicle_count": 1} for a, b in zip(cams, cams[1:]))
    od = pd.DataFrame(od_rows).groupby(["origin_camera", "destination_camera"], as_index=False).vehicle_count.sum() if od_rows else pd.DataFrame(columns=["origin_camera", "destination_camera", "vehicle_count"])
    hourly = events.assign(hour=events.timestamp.fillna(0).floordiv(3600).astype(int)).groupby("hour").size().reset_index(name="vehicle_observations")
    by_camera["traffic_load"] = by_camera.vehicle_observations
    return {"total_unique_vehicles": events.global_vehicle_id.nunique(), "total_observations": len(events), "by_class": events.vehicle_class.value_counts().to_dict(), "by_camera": by_camera, "plate_recognized": len(reliable), "plate_unreadable": len(events)-len(reliable), "hourly": hourly, "od": od, "load": by_camera.sort_values("traffic_load", ascending=False)}

def make_alerts(events: pd.DataFrame, blacklist_path: str | Path) -> pd.DataFrame:
    if events.empty: return pd.DataFrame(columns=["alert_type", "plate", "camera_id", "timestamp", "global_vehicle_id", "confidence", "reason"])
    path = Path(blacklist_path); data = json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}
    blocked = {normalize_text(str(k)): str(v) for k, v in (data.items() if isinstance(data, dict) else ((x, "blacklisted") for x in data))}
    rows = [{"alert_type":"BLACKLIST", "plate":r.normalized_plate, "camera_id":r.camera_id, "timestamp":r.timestamp, "global_vehicle_id":r.global_vehicle_id, "confidence":r.ocr_confidence, "reason":blocked[r.normalized_plate]} for r in events.itertuples() if r.normalized_plate in blocked and r.ocr_confidence >= .25]
    return pd.DataFrame(rows)

def route_anomalies(events: pd.DataFrame) -> pd.DataFrame:
    rows = []
    for gid in events.loc[events.global_vehicle_id.str.startswith("GV-"), "global_vehicle_id"].unique() if not events.empty else []:
        route = trajectory_frame(events, gid)
        for r in route.itertuples():
            if pd.notna(r.estimated_speed_kmh) and r.estimated_speed_kmh > 180:
                rows.append({"alert_type":"ROUTE_ANOMALY", "global_vehicle_id":gid, "from_camera":r.camera_id, "reason":f"Unusually rapid travel: estimated {r.estimated_speed_kmh:.1f} km/h using straight-line distance."})
    return pd.DataFrame(rows, columns=["alert_type", "global_vehicle_id", "from_camera", "reason"])
