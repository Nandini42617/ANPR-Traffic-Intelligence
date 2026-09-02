# ANPR Traffic AI

## Overview

ANPR Traffic AI is a Streamlit application for vehicle detection, tracking, license-plate OCR, cross-camera identity, trajectory reconstruction, and traffic intelligence from CCTV or traffic videos.

## Problem Statement

City camera networks produce large volumes of isolated observations. This project links reliable plate observations across configured cameras, while keeping uncertain OCR as `UNKNOWN` instead of fabricating identities.

## Key Features

- YOLO vehicle detection and ByteTrack tracking
- YOLO license-plate detection and quality-ranked best crops
- RapidOCR primary OCR with EasyOCR fallback
- Multi-frame OCR evidence and Indian plate validation
- Plate-backed global vehicle IDs and trajectories
- Configurable camera locations, directions, and sources
- Camera traffic counts, classes, trends, load, heatmap, and OD transitions
- Blacklist alerts and explainable rapid-travel anomalies
- Annotated video and CSV exports

## System Architecture

```text
Vehicle Detection → Tracking → Plate Detection → Best Crop → OCR
→ Temporal Consensus → Validation → Multi-Camera Association
→ Analytics / Trajectory / Alerts
```

## Tech Stack

Python, FastAPI, React/Vite, Ultralytics YOLO, OpenCV, NumPy, Pandas, RapidOCR ONNX Runtime, EasyOCR, PyTorch, and PyDeck.

The production flow is `React/Vite frontend → FastAPI → existing ANPR pipeline`. Streamlit `app.py` remains a reference interface for the working processing logic.

## Project Structure

- `app.py` — Streamlit dashboard and processing workflow
- `api.py` — asynchronous FastAPI integration layer for VigilantFlow
- `anpr/pipeline.py` — vehicle/plate inference, crop selection, OCR, and records
- `anpr/ocr.py` — OCR adapters, preprocessing, normalization, and validation
- `anpr/multicamera.py` — camera configuration, events, trajectories, analytics, and alerts
- `anpr/association.py` — plate-backed global IDs and legacy alert helpers
- `anpr/analytics.py` — aggregate compatibility helpers
- `config.py` — project-root paths and inference settings
- `cameras.json` — editable camera metadata; bundled coordinates are marked demo/configurable
- `blacklist.json` — editable blacklist configuration
- `videos/` — bundled demo videos
- `models/` and `yolo26n.pt` — required model weights
- `01_*.ipynb` through `04_*.ipynb` — development and experimentation notebooks

## Installation

From the repository root:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

`requirements.txt` is the dependency source of truth.

## How to Run

```powershell
python -m uvicorn api:app --host 0.0.0.0 --port 8000
```

In a second terminal, run the React frontend from `traffic monitor(FRONTEND)` with `npm install` and `npm run dev`.

The sidebar accepts uploads or bundled project videos. Processing starts only after clicking **Start Processing**. The CLI is also available:

```powershell
python run_pipeline.py --video videos/cam_1.mp4 --frame-stride 4
```

## Input Videos

Bundled sources are discovered dynamically from `videos/` and currently include `videos/cam_1.mp4`, `videos/cam_2.mp4`, and `videos/cam_3.mp4`. Uploaded sources are temporarily stored and processed as separate camera inputs.

## OCR Pipeline

Detected vehicle crops are passed to the plate detector. Quality-ranked plate crops are upscaled and evaluated with preprocessing variants. RapidOCR is attempted first; EasyOCR is used as a fallback when available. Distinct source frames provide temporal evidence, and only structurally valid, sufficiently supported candidates become final plates.

## OCR Reliability

Recognition depends strongly on source resolution, plate size, motion blur, lighting, viewing angle, compression, and plate visibility. The bundled run is an engineering demonstration, not a labeled ground-truth accuracy evaluation. The application favors `UNKNOWN`, `OCR Unreadable`, or `Low Confidence` over unsupported recognition.

## Multi-Camera Tracking

Each source has camera-local tracking IDs. Reliable normalized plates create IDs such as `GV-MH02YA8015`. Trajectory events are chronological and include source-relative timestamps and straight-line/geodesic distance when coordinates are configured. A cross-camera transition is created only when the same reliable plate is actually observed at multiple cameras; unknown vehicles remain camera-scoped.

## Traffic Analytics

Analytics are derived from processed records and include total observations, unique IDs, vehicle classes, camera counts, recognized/unreadable plates, hourly trends, traffic load, a camera heatmap, and origin-to-destination transitions for reliable global identities.

## Alerts

Blacklist alerts require a recognized plate and confidence threshold. Route anomalies are explainable indicators such as unusually rapid travel based on available timestamps and geodesic distance. Missing data is not treated as suspicious.

## Output Files

Runtime files are written under `outputs/app/` and include:

- per-video `*_records.csv` and `*_results.json`
- `vehicle_events.csv`
- `alerts.csv`
- `route_anomalies.csv`
- annotated videos under `annotated_videos/`

Generated outputs are ignored by Git.

## Known Limitations

- CPU-only inference can be slow; CUDA is used automatically when available.
- EasyOCR may be unavailable with incompatible Torch/Python installations; the failure is handled and RapidOCR continues.
- Low-resolution or blurred plates may remain unreadable.
- No labeled ground-truth dataset is included for a formal OCR accuracy claim.
- The bundled videos do not necessarily contain repeated plates across cameras, so OD transitions may be empty.
- Demo coordinates in `cameras.json` must be replaced with surveyed camera coordinates for operational GIS or speed interpretation.

## Future Improvements

Stronger OCR models, validated super-resolution, higher-resolution cameras, a labeled evaluation dataset, GPU inference, calibrated road-network distances, and improved appearance-based re-identification can extend the system.
