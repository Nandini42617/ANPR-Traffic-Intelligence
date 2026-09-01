"""Sequential ANPR inference using the models selected by Notebook 4."""
from __future__ import annotations
import csv, json, logging, time, hashlib
from collections import defaultdict
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Callable
from difflib import SequenceMatcher
import cv2
import numpy as np
from ultralytics import YOLO
from config import SETTINGS, Settings
from .ocr import create_ocr_backend, indian_plate_score, normalize_plate_candidate, normalize_text

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
    status: str = "No Plate Detected"
    global_vehicle_id: str = ""
    number_of_plate_observations: int = 0
    best_plate_width: int = 0
    best_plate_height: int = 0
    ocr_attempts: int = 0
    distinct_frames_used: int = 0
    ocr_candidates: list[dict] = field(default_factory=list)
    plate_bbox: tuple[int, int, int, int] | None = None
    ocr_backend: str = ""

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
    vehicles_with_plate: int = 0
    vehicle_frames_processed: int = 0
    ocr_attempts: int = 0
    recognized_plates: int = 0
    unreadable_plates: int = 0
    elapsed_seconds: float = 0.0
    error: str = ""

class ANPRPipeline:
    def __init__(self, settings: Settings = SETTINGS, enable_ocr: bool = True) -> None:
        self.settings = settings
        self.vehicle_model = self._load_model(settings.vehicle_model)
        self.plate_model = self._load_model(settings.plate_model)
        self.ocr = create_ocr_backend() if enable_ocr else None
        self.device = self._device(settings.device)
        self.plate_imgsz = min(settings.plate_image_size, 640) if self.device == "cpu" else settings.plate_image_size
        self._ocr_cache = {}

    @staticmethod
    def _device(configured: str) -> str:
        if configured != "auto": return configured
        try:
            import torch
            return "cuda:0" if torch.cuda.is_available() else "cpu"
        except Exception:
            return "cpu"

    @staticmethod
    def _load_model(path: Path) -> YOLO:
        if not path.exists(): raise FileNotFoundError(f"Model file not found: {path}")
        return YOLO(str(path))

    @staticmethod
    def _crop(frame: np.ndarray, box: np.ndarray):
        h, w = frame.shape[:2]; x1, y1, x2, y2 = map(int, box)
        coords = max(0,x1), max(0,y1), min(w,x2), min(h,y2)
        return frame[coords[1]:coords[3], coords[0]:coords[2]], coords

    @staticmethod
    def _padded_crop(frame: np.ndarray, box: tuple[int, int, int, int], padding: float = 0.08):
        x1, y1, x2, y2 = box
        px, py = int((x2 - x1) * padding), int((y2 - y1) * padding)
        return ANPRPipeline._crop(frame, np.array([x1 - px, y1 - py, x2 + px, y2 + py]))[0]

    @staticmethod
    def _candidate_cluster(text: str, candidates: list[tuple[str, float, float, float, int]]) -> bool:
        """Match OCR variants conservatively without O/0 or I/1 guessing."""
        for other, _ocr, _plate, _quality, _frame in candidates:
            if abs(len(text) - len(other)) <= 1 and SequenceMatcher(None, text, other).ratio() >= 0.84:
                return True
        return False

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
        tracks = {}; observations = defaultdict(list); plate_observations = defaultdict(list); plate_checked = set(); best_crop_score = {}; last_boxes = []; frame_no = 0
        try:
            while max_frames is None or frame_no < max_frames:
                ok, frame = cap.read()
                if not ok: break
                result.frames_processed += 1
                if frame_no % max(1, self.settings.frame_stride) == 0:
                    result.frames_inferred += 1; current = []
                    tracked = self.vehicle_model.track(source=frame, persist=True, tracker="bytetrack.yaml", conf=self.settings.vehicle_confidence, imgsz=self.settings.image_size, device=self.device, verbose=False)[0]
                    if tracked.boxes is not None and len(tracked.boxes):
                        boxes = tracked.boxes.xyxy.cpu().numpy(); classes = tracked.boxes.cls.cpu().numpy()
                        ids = tracked.boxes.id.cpu().numpy().astype(int) if tracked.boxes.id is not None else np.arange(len(boxes))+1
                        eligible = []
                        for box, cls, raw_id in zip(boxes, classes, ids):
                            vehicle_class = str(self.vehicle_model.names[int(cls)]).lower()
                            if vehicle_class not in VEHICLE_CLASSES: continue
                            track_id = int(raw_id)
                            vehicle_crop, vehicle_coords = self._crop(frame, box)
                            sample_no = frame_no // max(1, self.settings.frame_stride)
                            should_detect = sample_no % max(1, self.settings.plate_detection_interval) == 0 or track_id not in plate_checked
                            if vehicle_crop.size and should_detect:
                                eligible.append((track_id, vehicle_crop, vehicle_coords))
                        plate_predictions = {}
                        if eligible:
                            # One batched plate-model call per tracking frame.
                            predictions = self.plate_model.predict(source=[x[1] for x in eligible], conf=self.settings.plate_confidence, imgsz=self.plate_imgsz, device=self.device, verbose=False)
                            plate_predictions = {item[0]: (prediction, item[2]) for item, prediction in zip(eligible, predictions)}
                            plate_checked.update(item[0] for item in eligible)
                        for box, cls, raw_id in zip(boxes, classes, ids):
                            vehicle_class = str(self.vehicle_model.names[int(cls)]).lower()
                            if vehicle_class not in VEHICLE_CLASSES: continue
                            track_id = int(raw_id); now = frame_no / fps
                            record = tracks.get(track_id) or VehicleRecord(video_path.stem, f"{video_path.stem}-V{track_id}", vehicle_class, first_seen=now)
                            record.last_seen = now; plate_box = None; plate_text = ""; ocr_conf = 0.0
                            vehicle_crop, vehicle_coords = self._crop(frame, box); result.vehicle_frames_processed += 1
                            # Plate detections are mapped back to their track ID
                            # from the single batched inference above.
                            if track_id in plate_predictions:
                                plates, vehicle_coords = plate_predictions[track_id]
                                if plates.boxes is not None and len(plates.boxes):
                                    best = int(plates.boxes.conf.argmax().item()); local = plates.boxes.xyxy.cpu().numpy()[best]; plate_conf = float(plates.boxes.conf.cpu().numpy()[best])
                                    plate_box = (int(vehicle_coords[0]+local[0]), int(vehicle_coords[1]+local[1]), int(vehicle_coords[0]+local[2]), int(vehicle_coords[1]+local[3]))
                                    plate_crop = self._padded_crop(frame, plate_box); result.plates_detected += 1
                                    if not record.plate_detected: result.vehicles_with_plate += 1
                                    record.plate_detected = True
                                    if plate_crop.shape[0] >= 18 and plate_crop.shape[1] >= 30:
                                        gray_crop = cv2.cvtColor(plate_crop, cv2.COLOR_BGR2GRAY)
                                        sharpness = min(1.0, cv2.Laplacian(gray_crop, cv2.CV_64F).var() / 500.0)
                                        crop_score = plate_conf * .65 + sharpness * .35
                                        if crop_score > best_crop_score.get(track_id, -1.0):
                                            best_crop_score[track_id] = crop_score
                                            record.plate_confidence = plate_conf; record.best_frame = frame_no; record.plate_bbox = plate_box
                                            if self.settings.save_plate_crops:
                                                crop_dir = self.settings.output_dir / "plate_crops"; crop_dir.mkdir(parents=True, exist_ok=True)
                                                if plate_crop.size: cv2.imwrite(str(crop_dir / f"{video_path.stem}_V{track_id}_frame{frame_no}.jpg"), plate_crop)
                                        plate_observations[track_id].append((frame_no, plate_crop.copy(), plate_conf, crop_score))
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
            # OCR only the best distinct source frames; preprocessing variants
            # from one frame are not temporal evidence.
            selected = sorted(plate_observations[track_id], key=lambda x: x[3], reverse=True)[:5]
            record.number_of_plate_observations = len(plate_observations[track_id])
            if selected:
                best_frame, best_crop, _best_conf, _best_quality = selected[0]
                record.best_plate_width, record.best_plate_height = best_crop.shape[1], best_crop.shape[0]
            if self.ocr:
                record.ocr_backend = type(self.ocr).__name__
                for source_frame, crop, plate_conf, crop_quality in selected:
                    result.ocr_attempts += 1
                    record.ocr_attempts += 1
                    cache_key = hashlib.sha1(crop.tobytes()).hexdigest()
                    frame_candidates = self._ocr_cache.get(cache_key)
                    if frame_candidates is None:
                        frame_candidates = self.ocr.read_candidates(crop)
                        self._ocr_cache[cache_key] = frame_candidates
                    if frame_candidates:
                        best_candidate, best_candidate_conf = max(frame_candidates, key=lambda x: x[1])
                        record.ocr_candidates.append({"frame": source_frame, "text": best_candidate, "confidence": round(best_candidate_conf, 4)})
                    for candidate, candidate_conf in frame_candidates:
                        cleaned = normalize_plate_candidate(candidate)
                        if cleaned:
                            observations[track_id].append((cleaned, candidate_conf, plate_conf, crop_quality, source_frame))
            if observations[track_id]:
                # Consolidate small, OCR-only substitutions across frames while
                # retaining the strongest observed spelling as the final text.
                clusters: list[list[tuple[str, float, float, float, int]]] = []
                for candidate in observations[track_id]:
                    for cluster in clusters:
                        if self._candidate_cluster(candidate[0], cluster): cluster.append(candidate); break
                    else: clusters.append([candidate])
                values = max(clusters, key=lambda group:(len({v[4] for v in group}), sum(v[1] * v[2] * v[3] for v in group), max(v[1] for v in group)))
                text = max(values, key=lambda v:(v[1] * v[2] * v[3], indian_plate_score(v[0])))[0]
                # Confidence combines OCR, detector confidence, consensus, and soft plate syntax.
                # Six preprocessing variants from one frame are not six pieces
                # of temporal evidence. Count distinct source frames only.
                distinct_frames = len({v[4] for v in values})
                record.distinct_frames_used = distinct_frames
                consensus = min(1.0, distinct_frames / 3.0)
                confidence = min(1.0, max(v[1] for v in values) * .45 + max(v[2] for v in values) * .20 + consensus * .20 + indian_plate_score(text) * .15)
                # Require temporal agreement for a final recognition. A single
                # blurry crop may be retained as evidence but cannot be final.
                if distinct_frames >= 2 and confidence >= self.settings.min_ocr_confidence and indian_plate_score(text) > 0:
                    # Keep best_frame tied to the best plate crop, not merely
                    # the OCR frame that happened to score highest.
                    record.recognized_plate=text; record.ocr_confidence=confidence; record.status="Recognized" if confidence >= .45 else "Low Confidence"
                elif distinct_frames:
                    record.status = "Low Confidence"
            elif record.plate_detected and record.status != "OCR Unavailable": record.status="OCR Unreadable"
        result.records=list(tracks.values()); result.vehicles_detected=len(tracks); result.tracked_vehicles=len(tracks); result.recognized_plates=sum(r.recognized_plate!="UNKNOWN" for r in tracks.values()); result.unreadable_plates=sum(r.plate_detected and r.recognized_plate=="UNKNOWN" for r in tracks.values()); result.elapsed_seconds=time.perf_counter()-started
        return result

def save_result(result: ProcessingResult, directory: str | Path):
    directory=Path(directory); directory.mkdir(parents=True,exist_ok=True); stem=Path(result.input_video).stem; json_path=directory/f"{stem}_results.json"; csv_path=directory/f"{stem}_records.csv"; json_path.write_text(json.dumps(asdict(result),indent=2),encoding="utf-8")
    fields=["vehicle_id","camera_id","vehicle_class","timestamp","plate_detected","plate_confidence","plate_bbox","best_frame","crop_width","crop_height","ocr_backend","ocr_attempts","distinct_frames","raw_candidates","final_plate","ocr_confidence","status"]
    def row(record):
        return {"vehicle_id":record.vehicle_id,"camera_id":record.camera,"vehicle_class":record.vehicle_class,"timestamp":record.first_seen,"plate_detected":record.plate_detected,"plate_confidence":record.plate_confidence,"plate_bbox":record.plate_bbox or "","best_frame":record.best_frame,"crop_width":record.best_plate_width,"crop_height":record.best_plate_height,"ocr_backend":record.ocr_backend,"ocr_attempts":record.ocr_attempts,"distinct_frames":record.distinct_frames_used,"raw_candidates":record.ocr_candidates,"final_plate":record.recognized_plate,"ocr_confidence":record.ocr_confidence,"status":record.status}
    with csv_path.open("w",newline="",encoding="utf-8") as handle:
        writer=csv.DictWriter(handle,fieldnames=fields); writer.writeheader(); writer.writerows(row(record) for record in (result.records or []))
    return json_path,csv_path
