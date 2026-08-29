"""EasyOCR adapter based on the preprocessing used in notebook 03."""
from __future__ import annotations
import logging
import re
from typing import Any
import cv2
import numpy as np

LOGGER = logging.getLogger(__name__)

def normalize_text(text: str) -> str:
    return re.sub(r"[^A-Z0-9]", "", (text or "").upper())

def plate_format_score(text: str) -> int:
    score = 0
    if 8 <= len(text) <= 12: score += 2
    if re.search(r"[A-Z]", text): score += 1
    if re.search(r"[0-9]", text): score += 1
    if re.match(r"^[A-Z]{2}", text): score += 2
    if re.search(r"[A-Z]{2}[0-9]{1,2}", text): score += 1
    return score

class PlateOCR:
    def __init__(self, gpu: bool = False) -> None:
        self.gpu = gpu
        self.reader: Any | None = None
        self.error: str | None = None

    def load(self) -> bool:
        if self.reader is not None: return True
        try:
            import easyocr
            self.reader = easyocr.Reader(["en"], gpu=self.gpu)
            return True
        except Exception as exc:
            self.error = str(exc)
            LOGGER.exception("EasyOCR could not be loaded")
            return False

    @staticmethod
    def variants(crop: np.ndarray) -> list[np.ndarray]:
        if crop is None or crop.size == 0: return []
        image = cv2.resize(crop, None, fx=3, fy=3, interpolation=cv2.INTER_CUBIC)
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        enhanced = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8)).apply(gray)
        threshold = cv2.adaptiveThreshold(enhanced, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 31, 11)
        return [image, gray, enhanced, threshold]

    def read(self, crop: np.ndarray) -> tuple[str, float]:
        if crop is None or crop.size == 0 or not self.load(): return "", 0.0
        candidates: list[tuple[str, float, float]] = []
        for variant in self.variants(crop):
            try:
                results = self.reader.readtext(variant, detail=1, paragraph=False, allowlist="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789")
            except Exception:
                LOGGER.exception("OCR failed for a plate crop")
                continue
            parts, confidences = [], []
            for _bbox, text, confidence in sorted(results or [], key=lambda x: min(p[0] for p in x[0])):
                cleaned = normalize_text(text)
                if cleaned:
                    parts.append(cleaned); confidences.append(float(confidence))
            if parts:
                text = "".join(parts); confidence = float(np.mean(confidences))
                score = confidence * 2 + plate_format_score(text) * 0.20 + min(len(text), 12) * 0.05
                candidates.append((text, confidence, score))
        if not candidates: return "", 0.0
        text, confidence, _ = max(candidates, key=lambda item: item[2])
        return text, confidence
