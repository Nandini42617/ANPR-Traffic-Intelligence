"""Honest aggregate analytics over completed ProcessingResult objects."""
from __future__ import annotations
from collections import Counter
from .multicamera import analytics as centralized_analytics

def summarize(results):
    records = [r for result in results for r in (result.records or [])]
    return {
        "cameras": sorted({r.camera for r in records}),
        "vehicle_count": len(records),
        "vehicle_classes": dict(Counter(r.vehicle_class for r in records)),
        "camera_vehicle_counts": dict(Counter(r.camera for r in records)),
        "camera_plate_counts": dict(Counter(r.camera for r in records if r.plate_detected)),
        "recognized_plate_count": sum(r.recognized_plate != "UNKNOWN" for r in records),
        "note": "Counts describe tracked records; density, speed, GPS, and congestion require calibration/scene metadata.",
    }

def summarize_events(events):
    """Return the complete data-driven aggregate for a centralized event frame."""
    return centralized_analytics(events)
