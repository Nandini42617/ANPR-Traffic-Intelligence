"""FastAPI integration layer for the existing ANPR pipeline.

The API deliberately delegates inference to ``ANPRPipeline`` and only adapts
its persisted results for the VigilantFlow client.
"""
from __future__ import annotations

import json
import hashlib
import logging
import shutil
import threading
import uuid
from concurrent.futures import ThreadPoolExecutor
from dataclasses import asdict
from pathlib import Path
from typing import Any

import pandas as pd
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

from anpr.association import assign_global_ids
from anpr.multicamera import analytics, build_events, load_cameras, make_alerts, route_anomalies, trajectory_frame
from anpr.pipeline import ANPRPipeline, ProcessingResult, save_result
from anpr.ocr import normalize_text
from config import SETTINGS

LOGGER = logging.getLogger("vigilantflow.api")
ROOT = Path(__file__).resolve().parent
STORE = SETTINGS.output_dir / "api"
JOBS = STORE / "jobs"
UPLOADS = STORE / "uploads"
ANNOTATED = SETTINGS.output_dir / "annotated_videos"
WATCHLIST_PATH = STORE / "watchlist.json"
CAMERAS = load_cameras(ROOT / "cameras.json")
executor = ThreadPoolExecutor(max_workers=2)
jobs: dict[str, dict[str, Any]] = {}
jobs_lock = threading.Lock()

app = FastAPI(title="VigilantFlow ANPR API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


class WatchlistRequest(BaseModel):
    plate: str
    category: str = "CUSTOM"
    notes: str = ""


def _jsonable(value: Any) -> Any:
    if isinstance(value, Path): return str(value)
    if isinstance(value, (pd.Timestamp,)): return value.isoformat()
    if hasattr(value, "item"): return value.item()
    if pd.isna(value) if not isinstance(value, (list, dict, tuple)) else False: return None
    return value


def _records(result: ProcessingResult) -> list[dict[str, Any]]:
    return [{k: _jsonable(v) for k, v in asdict(r).items()} for r in (result.records or [])]


def _load_watchlist() -> dict[str, dict[str, Any]]:
    if WATCHLIST_PATH.exists():
        return json.loads(WATCHLIST_PATH.read_text(encoding="utf-8"))
    return {}


def _save_watchlist(data: dict[str, dict[str, Any]]) -> None:
    STORE.mkdir(parents=True, exist_ok=True)
    WATCHLIST_PATH.write_text(json.dumps(data, indent=2), encoding="utf-8")


def _source(video_name: str) -> Path:
    candidate = SETTINGS.videos_dir / Path(video_name).name
    if not candidate.exists() or candidate.suffix.lower() not in {".mp4", ".avi", ".mov", ".mkv"}:
        raise HTTPException(400, f"Invalid bundled video selection: {video_name}")
    return candidate

def _fingerprint(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""): digest.update(chunk)
    return digest.hexdigest()

def _sources() -> list[dict[str, str]]:
    supported = {".mp4", ".avi", ".mov", ".mkv"}
    configured = {camera.source: camera for camera in CAMERAS if camera.source}
    return [{"id": configured[path.name].camera_id if path.name in configured else path.stem, "filename": path.name, "display_name": configured[path.name].camera_name if path.name in configured else path.stem, "latitude": configured[path.name].latitude if path.name in configured else None, "longitude": configured[path.name].longitude if path.name in configured else None} for path in sorted(SETTINGS.videos_dir.iterdir()) if path.is_file() and path.suffix.lower() in supported]


def _job_view(job: dict[str, Any]) -> dict[str, Any]:
    return {k: v for k, v in job.items() if k != "source"}

def _fingerprint_matches(job_data: dict[str, Any]) -> bool:
    path = Path(job_data.get("source_path", ""))
    expected = job_data.get("source_fingerprint")
    return bool(expected and path.exists() and _fingerprint(path) == expected)


def _serialize_job(job_id: str, source: Path, display_name: str, stride: int, enable_ocr: bool) -> None:
    LOGGER.info("job created id=%s video=%s", job_id, display_name)
    try:
        settings = SETTINGS.__class__(**{**SETTINGS.__dict__, "frame_stride": stride})
        pipeline = ANPRPipeline(settings, enable_ocr=enable_ocr)
        output = ANNOTATED / f"{job_id}_{Path(display_name).stem}_processed.mp4"
        cap_total = 0
        import cv2
        cap = cv2.VideoCapture(str(source)); cap_total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)); cap.release()
        with jobs_lock:
            jobs[job_id].update(status="processing", total_frames=cap_total, progress=0)
        LOGGER.info("processing started id=%s", job_id)
        def progress(done: int, total: int) -> None:
            with jobs_lock:
                if job_id in jobs:
                    jobs[job_id].update(progress=round(done / max(total, 1) * 100, 1), frames_processed=done)
            if done == total: LOGGER.info("100%% frames processed id=%s", job_id)
        result = pipeline.process_video(source, output, progress=progress)
        if result.error: raise RuntimeError(result.error)
        assign_global_ids([result])
        result_dir = JOBS / job_id; result_dir.mkdir(parents=True, exist_ok=True)
        save_result(result, result_dir)
        events = build_events([result], CAMERAS)
        event_records = [{k: _jsonable(v) for k, v in row.items()} for row in events.to_dict("records")]
        alert_df = make_alerts(events, ROOT / "blacklist.json")
        anomaly_df = route_anomalies(events)
        watchlist = _load_watchlist()
        watch_alerts = []
        for row in events.to_dict("records"):
            plate = normalize_text(str(row.get("normalized_plate", "")))
            if plate in watchlist:
                watch_alerts.append({"alert_type": "WATCHLIST_MATCH", "plate": plate, "camera_id": row.get("camera_id", ""), "timestamp": row.get("timestamp", 0), "global_vehicle_id": row.get("global_vehicle_id", ""), "confidence": row.get("ocr_confidence", 0), "reason": watchlist[plate].get("category", "Watchlist match"), "location": row.get("location", "")})
        alert_rows = pd.concat([alert_df, anomaly_df], ignore_index=True, sort=False).fillna("").to_dict("records") + watch_alerts
        alerts = [{k: _jsonable(v) for k, v in row.items()} for row in alert_rows]
        summary = analytics(events)
        summary = {k: (_jsonable(v.to_dict("records")) if isinstance(v, pd.DataFrame) else _jsonable(v)) for k, v in summary.items()}
        with jobs_lock:
            jobs[job_id].update(status="completed", progress=100, frames_processed=result.frames_processed,
                completed_result={"job_id": job_id, "video_name": display_name, "result": asdict(result),
                "records": _records(result), "events": event_records, "cameras": [asdict(c) for c in CAMERAS], "analytics": summary, "alerts": alerts,
                "video_url": f"/api/video/{job_id}"})
        (result_dir / "job.json").write_text(json.dumps(_job_view(jobs[job_id]), default=_jsonable, indent=2), encoding="utf-8")
        LOGGER.info("results stored id=%s", job_id); LOGGER.info("completed id=%s", job_id)
    except Exception as exc:
        LOGGER.exception("failed id=%s", job_id)
        with jobs_lock: jobs[job_id].update(status="failed", error=str(exc))


@app.get("/api/health")
def health(): return {"status": "ok", "pipeline": "ANPRPipeline", "models": {"vehicle": str(SETTINGS.vehicle_model), "plate": str(SETTINGS.plate_model)}}

@app.get("/api/cameras")
def cameras(): return [asdict(camera) for camera in CAMERAS]

@app.get("/api/sources")
def sources(): return _sources()

@app.post("/api/process")
async def process(video: UploadFile | None = File(None), video_name: str | None = Form(None), frame_stride: int = Form(SETTINGS.frame_stride), enable_ocr: bool = Form(True)):
    if video is None and not video_name: raise HTTPException(400, "Choose a bundled video or upload a video file")
    UPLOADS.mkdir(parents=True, exist_ok=True)
    if video is not None:
        display_name = Path(video.filename or "upload.mp4").name; source = UPLOADS / f"{uuid.uuid4().hex}_{display_name}"
        with source.open("wb") as handle: shutil.copyfileobj(video.file, handle)
    else: display_name = Path(video_name or "").name; source = _source(display_name)
    job_id = uuid.uuid4().hex
    with jobs_lock: jobs[job_id] = {"job_id": job_id, "status": "queued", "progress": 0, "video_name": display_name, "error": "", "source_path": str(source), "source_fingerprint": _fingerprint(source)}
    executor.submit(_serialize_job, job_id, source, display_name, max(1, min(frame_stride, 10)), enable_ocr)
    return _job_view(jobs[job_id])

@app.get("/api/jobs/{job_id}")
def job(job_id: str):
    with jobs_lock: current = jobs.get(job_id)
    if current is None:
        path = JOBS / job_id / "job.json"
        if path.exists(): current = json.loads(path.read_text(encoding="utf-8"))
    if current is None: raise HTTPException(404, "Job not found")
    if current.get("status") == "completed" and not _fingerprint_matches(current):
        raise HTTPException(404, "Persisted result is stale because the source video changed")
    return _job_view(current)

def _completed(job_id: str | None = None) -> dict[str, Any]:
    if job_id: return job(job_id).get("completed_result") or {}
    with jobs_lock: done = [x for x in jobs.values() if x.get("status") == "completed"]
    for path in JOBS.glob("*/job.json"):
        try:
            disk = json.loads(path.read_text(encoding="utf-8"))
            if disk.get("status") == "completed" and _fingerprint_matches(disk): done.append(disk)
        except (OSError, json.JSONDecodeError):
            continue
    if not done: raise HTTPException(404, "No completed ANPR result is available")
    return done[-1].get("completed_result", {})

@app.get("/api/results")
def results(job_id: str | None = None): return _completed(job_id)
@app.get("/api/detections")
def detections(job_id: str | None = None): return _completed(job_id).get("events", [])
@app.get("/api/analytics")
def get_analytics(job_id: str | None = None): return _completed(job_id).get("analytics", {})
@app.get("/api/alerts")
def get_alerts(job_id: str | None = None): return _completed(job_id).get("alerts", [])

@app.get("/api/watchlist")
def watchlist(): return list(_load_watchlist().values())
@app.post("/api/watchlist")
def add_watchlist(item: WatchlistRequest):
    plate = "".join(c for c in item.plate.upper() if c.isalnum())
    if not plate: raise HTTPException(400, "Plate is required")
    priority = "high" if item.category.upper() == "STOLEN" else "medium"
    from datetime import datetime, timezone
    data = _load_watchlist(); entry = {"id": f"wl-{plate}", "plate": plate, "category": item.category.upper(), "addedAt": datetime.now(timezone.utc).isoformat(), "priority": priority, "notes": item.notes}; data[plate] = entry; _save_watchlist(data); return entry
@app.delete("/api/watchlist/{plate}")
def remove_watchlist(plate: str):
    data = _load_watchlist(); data.pop("".join(c for c in plate.upper() if c.isalnum()), None); _save_watchlist(data); return {"ok": True}

@app.get("/api/trajectory/{query}")
def trajectory(query: str, job_id: str | None = None):
    target = _completed(job_id); route = trajectory_frame(pd.DataFrame(target.get("events", [])), query)
    return [{k: _jsonable(v) for k, v in row.items()} for row in route.to_dict("records")]
@app.get("/api/search/{query}")
def search(query: str, job_id: str | None = None):
    target = _completed(job_id); q = query.upper(); rows = target.get("events", [])
    return [r for r in rows if q in str(r.get("normalized_plate", "")).upper() or q in str(r.get("global_vehicle_id", "")).upper() or q in str(r.get("camera_id", "")).upper()]
@app.get("/api/video/{job_id}")
def video(job_id: str):
    current = job(job_id); result = current.get("completed_result", {}); path = Path(result.get("result", {}).get("output_video", ""))
    if not path.exists():
        matches = list(ANNOTATED.glob(f"{job_id}_*")); path = matches[0] if matches else path
    if not path.exists(): raise HTTPException(404, "Annotated video is not available")
    return FileResponse(path, media_type="video/mp4", filename=path.name)

@app.get("/api/source/{filename}")
def source_video(filename: str):
    path = _source(filename)
    return FileResponse(path, media_type="video/mp4", filename=path.name)
