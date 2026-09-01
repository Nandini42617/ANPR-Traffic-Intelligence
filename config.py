"""Application configuration and paths."""
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parent

@dataclass(frozen=True)
class Settings:
    vehicle_model: Path = ROOT / "yolo26n.pt"
    plate_model: Path = ROOT / "models" / "number_plate_detection_best.pt"
    videos_dir: Path = ROOT / "videos"
    output_dir: Path = ROOT / "outputs" / "app"
    vehicle_confidence: float = 0.20
    # The detector's real-video confidences are low for tiny plates; keep this
    # permissive and let geometry/quality/OCR validation reject false positives.
    plate_confidence: float = 0.03
    image_size: int = 640
    plate_image_size: int = 1280
    frame_stride: int = 2
    ocr_interval: int = 5
    min_ocr_confidence: float = 0.25
    # Run plate detection periodically per active track; every observation is
    # still eligible for tracking/annotation and the best sampled crops feed OCR.
    plate_detection_interval: int = 2
    save_plate_crops: bool = False
    device: str = "auto"

SETTINGS = Settings()
