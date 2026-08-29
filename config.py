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
    plate_confidence: float = 0.10
    image_size: int = 640
    plate_image_size: int = 1280
    frame_stride: int = 2
    ocr_interval: int = 10
    min_ocr_confidence: float = 0.25

SETTINGS = Settings()
