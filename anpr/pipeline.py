"""Sequential ANPR inference using the models selected by Notebook 4."""
from __future__ import annotations
import csv, json, logging, time
from collections import defaultdict
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Callable
import cv2
import numpy as np
from ultralytics import YOLO
from config import SETTINGS, Settings
from .ocr import PlateOCR, normalize_text

LOGGER = logging.getLogger(__name__)
VEHICLE_CLASSES = {"car", "motorcycle", "bus", "truck"}

@dataclass
class VehicleRecord:
    camera: str
    vehicle_id: str
    vehicle_class: str
    first_seen: float = 0.0
    last_seen: float = 0.0
    plate_detected: bool = False
    recognized_plate: str = "UNKNOWN"
    ocr_confidence: float = 0.0
    plate_confidence: float = 0.0
    best_frame: int = -1
    status: str = "Plate Not Detected"

@dataclass
class ProcessingResult:
    input_video: str
    output_video: str = ""
    records: list[VehicleRecord] | None = None
    frames_processed: int = 0
    frames_inferred: int = 0
    vehicles_detected: int = 0
    tracked_vehicles: int = 0
    plates_detected: int = 0
    recognized_plates: int = 0
    unreadable_plates: int = 0
    elapsed_seconds: float = 0.0
    error: str = ""

class ANPRPipeline:
    def __init__(self, settings: Settings = SETTINGS, enable_ocr: bool = True) -> None:
        self.settings = settings
        self.vehicle_model = self._load_model(settings.vehicle_model)
        self.plate_model = self._load_model(settings.plate_model)
        self.ocr = PlateOCR() if enable_ocr else None

    @staticmethod
    def _load_model(path: Path) -> YOLO:
        if not path.exists(): raise FileNotFoundError(f"Model file not found: {path}")
        return YOLO(str(path))

    @staticmethod
    def _crop(frame: np.ndarray, box: np.ndarray):
        h, w = frame.shape[:2]; x1, y1, x2, y2 = map(int, box)
        coords = max(0,x1), max(0,y1), min(w,x2), min(h,y2)
        return frame[coords[1]:coords[3], coords[0]:coords[2]], coords

    def process_video(self, video_path: str | Path, output_path: str | Path | None = None,
                      max_frames: int | None = None, progress: Callable[[int,int],None] | None = None) -> ProcessingResult:
        video_path = Path(video_path); result = ProcessingResult(input_video=video_path.name, records=[])
        started = time.perf_counter(); cap = cv2.VideoCapture(str(video_path))
        if not cap.isOpened(): result.error = f"Could not open video: {video_path}"; return result
        fps = cap.get(cv2.CAP_PROP_FPS) or 30.0; total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)); writer = None
        if output_path:
            output_path = Path(output_path); output_path.parent.mkdir(parents=True, exist_ok=True)
            size = (int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)), int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)))
            writer = cv2.VideoWriter(str(output_path), cv2.VideoWriter_fourcc(*"mp4v"), fps, size); result.output_video = str(output_path)
        tracks = {}; observations = defaultdict(list); last_boxes = []; frame_no = 0
        try:
            while max_frames is None or frame_no < max_frames:
                ok, frame = cap.read()
                if not ok: break
                result.frames_processed += 1
                if frame_no % max(1, self.settings.frame_stride) == 0:
                    result.frames_inferred += 1; current = []
                    tracked = self.vehicle_model.track(source=frame, persist=True, tracker="bytetrack.yaml", conf=self.settings.vehicle_confidence, imgsz=self.settings.image_size, verbose=False)[0]
                    if tracked.boxes is not None and len(tracked.boxes):
                        boxes = tracked.boxes.xyxy.cpu().numpy(); classes = tracked.boxes.cls.cpu().numpy()
                        ids = tracked.boxes.id.cpu().numpy().astype(int) if tracked.boxes.id is not None else np.arange(len(boxes))+1
                        for box, cls, raw_id in zip(boxes, classes, ids):
                            vehicle_class = str(self.vehicle_model.names[int(cls)]).lower()
                            if vehicle_class not in VEHICLE_CLASSES: continue
                            track_id = int(raw_id); now = frame_no / fps
                            record = tracks.get(track_id) or VehicleRecord(video_path.stem, f"{video_path.stem}-V{track_id}", vehicle_class, first_seen=now)
                            record.last_seen = now; plate_box = None; plate_text = ""; ocr_conf = 0.0
                            vehicle_crop, vehicle_coords = self._crop(frame, box)
                            if vehicle_crop.size:
                                plates = self.plate_model.predict(source=vehicle_crop, conf=self.settings.plate_confidence, imgsz=self.settings.plate_image_size, verbose=False)[0]
                                if plates.boxes is not None and len(plates.boxes):
                                    best = int(plates.boxes.conf.argmax().item()); local = plates.boxes.xyxy.cpu().numpy()[best]; plate_conf = float(plates.boxes.conf.cpu().numpy()[best])
                                    plate_box = (int(vehicle_coords[0]+local[0]), int(vehicle_coords[1]+local[1]), int(vehicle_coords[0]+local[2]), int(vehicle_coords[1]+local[3]))
                                    plate_crop, _ = self._crop(frame, np.array(plate_box)); result.plates_detected += 1; record.plate_detected = True
                                    if plate_conf >= record.plate_confidence:
                                        record.plate_confidence = plate_conf; record.best_frame = frame_no
                                        crop_dir = self.settings.output_dir / "plate_crops"; crop_dir.mkdir(parents=True, exist_ok=True)
                                        if plate_crop.size: cv2.imwrite(str(crop_dir / f"{video_path.stem}_V{track_id}_frame{frame_no}.jpg"), plate_crop)
                                    if self.ocr and (frame_no % max(1,self.settings.ocr_interval) == 0 or track_id not in tracks): plate_text, ocr_conf = self.ocr.read(plate_crop)
                                    cleaned = normalize_text(plate_text)
                                    if cleaned and len(cleaned) >= 4 and ocr_conf >= self.settings.min_ocr_confidence: observations[track_id].append((cleaned, ocr_conf, frame_no))
                            if record.plate_detected and record.recognized_plate == "UNKNOWN": record.status = "OCR Unavailable" if self.ocr and self.ocr.error else "OCR Unreadable"
                            tracks[track_id] = record; current.append((box, track_id, plate_box, record.recognized_plate, record.ocr_confidence, record.status))
                    last_boxes = current
                annotated = frame.copy()
                for box, track_id, plate_box, plate, ocr_conf, status in last_boxes:
                    x1,y1,x2,y2 = map(int,box); cv2.rectangle(annotated,(x1,y1),(x2,y2),(255,120,0),2); cv2.putText(annotated,f"{video_path.stem}-V{track_id} F{frame_no}",(x1,max(22,y1-8)),cv2.FONT_HERSHEY_SIMPLEX,.55,(255,120,0),2)
                    if plate_box:
                        px1,py1,px2,py2=plate_box; cv2.rectangle(annotated,(px1,py1),(px2,py2),(0,220,80),2); label=f"{plate} ({ocr_conf:.0%})" if plate != "UNKNOWN" else status; cv2.putText(annotated,label,(px1,max(22,py1-8)),cv2.FONT_HERSHEY_SIMPLEX,.5,(0,220,80),2)
                if writer: writer.write(annotated)
                frame_no += 1
                if progress: progress(result.frames_processed,total)
        except Exception as exc:
            LOGGER.exception("Video processing failed: %s", video_path); result.error = str(exc)
        finally:
            cap.release()
            if writer: writer.release()
        for track_id, record in tracks.items():
            if observations[track_id]:
                grouped = defaultdict(list)
                for text, confidence, frame in observations[track_id]: grouped[text].append((confidence,frame))
                text, values = max(grouped.items(), key=lambda item:(len(item[1]),max(v[0] for v in item[1]),sum(v[0] for v in item[1])/len(item[1])))
                record.recognized_plate=text; record.ocr_confidence=max(v[0] for v in values); record.best_frame=max(values,key=lambda v:v[0])[1]; record.status="Recognized"
            elif record.plate_detected and record.status != "OCR Unavailable": record.status="OCR Unreadable"
        result.records=list(tracks.values()); result.vehicles_detected=len(tracks); result.tracked_vehicles=len(tracks); result.recognized_plates=sum(r.recognized_plate!="UNKNOWN" for r in tracks.values()); result.unreadable_plates=sum(r.plate_detected and r.recognized_plate=="UNKNOWN" for r in tracks.values()); result.elapsed_seconds=time.perf_counter()-started
        return result

def save_result(result: ProcessingResult, directory: str | Path):
    directory=Path(directory); directory.mkdir(parents=True,exist_ok=True); stem=Path(result.input_video).stem; json_path=directory/f"{stem}_results.json"; csv_path=directory/f"{stem}_records.csv"; json_path.write_text(json.dumps(asdict(result),indent=2),encoding="utf-8")
    fields=list(asdict(VehicleRecord("","","")))
    with csv_path.open("w",newline="",encoding="utf-8") as handle:
        writer=csv.DictWriter(handle,fieldnames=fields); writer.writeheader(); writer.writerows(asdict(record) for record in (result.records or []))
    return json_path,csv_path
