"""Cross-camera identity, trajectory, and configurable alert helpers."""
from __future__ import annotations
import json
from collections import defaultdict
from dataclasses import replace
from pathlib import Path
from .ocr import normalize_text

def assign_global_ids(results):
    """Assign stable IDs only when plate evidence agrees; unknowns stay camera-scoped."""
    by_plate = {}
    for result in results:
        for record in result.records or []:
            plate = normalize_text(record.recognized_plate)
            if plate and plate != "UNKNOWN":
                by_plate.setdefault(plate, f"GV-{plate}")
                record.global_vehicle_id = by_plate[plate]
            else:
                record.global_vehicle_id = f"{record.camera}-{record.vehicle_id}"
    return results

def trajectory(results, plate: str):
    target = normalize_text(plate); points = []
    for result in results:
        for record in result.records or []:
            if normalize_text(record.recognized_plate) == target:
                points.append({"plate": target, "camera": record.camera, "first_seen": record.first_seen, "last_seen": record.last_seen, "global_vehicle_id": record.global_vehicle_id})
    return sorted(points, key=lambda p: p["first_seen"])

def load_blacklist(path: str | Path):
    path = Path(path)
    if not path.exists(): return {}
    data = json.loads(path.read_text(encoding="utf-8"))
    return {normalize_text(str(k)): str(v) for k, v in (data.items() if isinstance(data, dict) else ((x, "blacklisted") for x in data))}

def alerts(results, blacklist_path: str | Path):
    blocked = load_blacklist(blacklist_path); found = []
    for result in results:
        for record in result.records or []:
            plate = normalize_text(record.recognized_plate)
            if plate in blocked:
                record.status = "Alert"
                found.append({"plate": plate, "camera": record.camera, "timestamp": record.first_seen, "reason": blocked[plate]})
    return found
