"""Robust EasyOCR adapter for small, noisy Indian number plates."""
from __future__ import annotations
import logging, re
from typing import Any
import cv2
import numpy as np

LOGGER = logging.getLogger(__name__)
ALLOWLIST = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
INDIAN_STATE_CODES = {"AN","AP","AR","AS","BR","CH","CG","DD","DL","DN","GA","GJ","HR","HP","JK","JH","KA","KL","LA","LD","MP","MH","MN","ML","MZ","NL","OD","OR","PB","PY","RJ","SK","TN","TS","TR","UP","UK","WB"}

def normalize_plate_candidate(text: str) -> str:
    """Normalize OCR ambiguity by slot, then accept only plate-shaped text."""
    raw = normalize_text(text)
    patterns = ("LLDDLLDDDD", "LLDDLDDDD", "LLDDLLDDD", "LLDDLDDD")
    letter_map = {"0":"O", "1":"I", "2":"Z", "5":"S", "6":"G", "8":"B"}
    digit_map = {"O":"0", "I":"1", "Z":"2", "S":"5", "B":"8", "G":"6"}
    for pattern in patterns:
        if len(raw) != len(pattern): continue
        substitutions = 0
        chars = []
        for char, slot in zip(raw, pattern):
            if slot == "L":
                if char not in "ABCDEFGHIJKLMNOPQRSTUVWXYZ":
                    char = letter_map.get(char, ""); substitutions += 1
                if not char or char not in "ABCDEFGHIJKLMNOPQRSTUVWXYZ": break
            else:
                if char not in "0123456789":
                    char = digit_map.get(char, ""); substitutions += 1
                if not char or char not in "0123456789": break
            chars.append(char)
        if len(chars) == len(pattern) and substitutions <= 1 and "".join(chars)[:2] in INDIAN_STATE_CODES:
            return "".join(chars)
    return ""

def normalize_text(text: str) -> str:
    return re.sub(r"[^A-Z0-9]", "", (text or "").upper())

def indian_plate_score(text: str) -> float:
    return 0.9 if normalize_plate_candidate(text) else 0.0

def plate_format_score(text: str) -> int:
    return round(indian_plate_score(text) * 10)

class PlateOCR:
    def __init__(self, gpu: bool = False, min_length: int = 6) -> None:
        self.gpu, self.min_length = gpu, min_length
        self.reader: Any | None = None; self.error: str | None = None

    def load(self) -> bool:
        if self.reader is not None: return True
        if self.error is not None: return False
        try:
            import easyocr
            self.reader = easyocr.Reader(["en"], gpu=self.gpu, verbose=False); return True
        except Exception as exc:
            self.error = str(exc); LOGGER.exception("EasyOCR could not be loaded"); return False

    @staticmethod
    def variants(crop: np.ndarray) -> list[np.ndarray]:
        if crop is None or crop.size == 0: return []
        h = crop.shape[0]; scale = max(3.0, min(8.0, 160.0 / max(h, 1)))
        image = cv2.resize(crop, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if image.ndim == 3 else image
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8)).apply(gray)
        sharp = cv2.addWeighted(clahe, 1.6, cv2.GaussianBlur(clahe, (0, 0), 1.1), -0.6, 0)
        denoised = cv2.fastNlMeansDenoising(sharp, None, 5, 7, 21)
        block = max(11, min(51, (min(denoised.shape[:2]) // 2) * 2 + 1))
        adaptive = cv2.adaptiveThreshold(denoised, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, block, 7)
        _, otsu = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        return [image, gray, clahe, sharp, adaptive, otsu]

    def read_candidates(self, crop: np.ndarray) -> list[tuple[str, float]]:
        if crop is None or crop.size == 0 or not self.load(): return []
        candidates = []
        for variant in self.variants(crop):
            try: results = self.reader.readtext(variant, detail=1, paragraph=False, allowlist=ALLOWLIST, decoder="beamsearch")
            except Exception: LOGGER.exception("OCR failed for a plate crop"); continue
            parts, confs = [], []
            for item in results or []:
                if len(item) < 3: continue
                cleaned = normalize_text(item[1])
                if cleaned: parts.append(cleaned); confs.append(float(item[2]))
            text = normalize_text("".join(parts))
            if len(text) >= self.min_length:
                raw = float(np.mean(confs)) if confs else 0.0
                candidates.append((text, min(1.0, raw * .8 + indian_plate_score(text) * .2)))
                if candidates[-1][1] >= 0.65:
                    break
        return candidates

    def read(self, crop: np.ndarray) -> tuple[str, float]:
        candidates = self.read_candidates(crop)
        return max(candidates, key=lambda x: (x[1], indian_plate_score(x[0]), len(x[0]))) if candidates else ("", 0.0)


class RapidPlateOCR:
    """Optional ONNX OCR backend. It keeps the same candidate API as EasyOCR."""
    def __init__(self, min_length: int = 6) -> None:
        self.min_length = min_length
        self.reader: Any | None = None
        self.error: str | None = None
        self.fallback: PlateOCR | None = None

    def load(self) -> bool:
        if self.reader is not None: return True
        try:
            from rapidocr_onnxruntime import RapidOCR
            self.reader = RapidOCR(); return True
        except Exception as exc:
            self.error = str(exc); LOGGER.exception("RapidOCR could not be loaded"); return False

    def read_candidates(self, crop: np.ndarray) -> list[tuple[str, float]]:
        if crop is None or crop.size == 0 or not self.load(): return []
        candidates = []
        for variant in PlateOCR.variants(crop):
            try: result, _timing = self.reader(variant)
            except Exception: LOGGER.exception("RapidOCR failed for a plate crop"); continue
            vals = [(normalize_text(x[1]), float(x[2])) for x in (result or []) if len(x) >= 3 and normalize_text(x[1])]
            text = normalize_text("".join(x[0] for x in vals))
            if len(text) >= self.min_length:
                raw = float(np.mean([x[1] for x in vals]))
                candidates.append((text, min(1.0, raw * .8 + indian_plate_score(text) * .2)))
                if candidates[-1][1] >= 0.65:
                    break
        if not candidates or max(x[1] for x in candidates) < 0.55:
            if self.fallback is None: self.fallback = PlateOCR(self.min_length)
            fallback_candidates = self.fallback.read_candidates(crop)
            if fallback_candidates: candidates.extend(fallback_candidates)
        return candidates

    def read(self, crop: np.ndarray) -> tuple[str, float]:
        candidates = self.read_candidates(crop)
        return max(candidates, key=lambda x: (x[1], indian_plate_score(x[0]), len(x[0]))) if candidates else ("", 0.0)


def create_ocr_backend(prefer_rapid: bool = True):
    """Use RapidOCR when installed, with EasyOCR as a safe fallback."""
    if prefer_rapid:
        rapid = RapidPlateOCR()
        if rapid.load(): return rapid
    return PlateOCR()
