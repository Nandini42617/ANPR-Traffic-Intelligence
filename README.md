# ANPR Traffic AI

## Overview

Demo-ready automatic number-plate recognition and traffic analysis built around the existing project notebooks and trained weights. Users can process one or more videos, inspect camera-wise vehicle records, view annotated output, and download CSV/video results.

## Architecture

```text
Video → Vehicle Detection → Vehicle Tracking → Vehicle ROI
      → Number Plate Detection → Plate Crop → Preprocessing → OCR
      → Temporal OCR Aggregation → Vehicle-Plate Mapping
      → Annotated Video + CSV + Dashboard
```

## Notebook-to-production mapping

- Notebook 01: vehicle dataset/model development. Its custom checkpoint is retained, but current videos use `yolo26n.pt` because Notebook 4 documented better detection with the pretrained COCO model.
- Notebook 02: plate dataset/training. Production uses `models/number_plate_detection_best.pt`, a single-class `plate` detector.
- Notebook 03: EasyOCR, upscale/grayscale/CLAHE/adaptive-threshold variants, cleaning, and soft Indian plate-format scoring.
- Notebook 04: vehicle-crop plate detection, ByteTrack, camera-wise processing, and vehicle/plate association. IDs remain camera-specific; no fake cross-camera ReID is performed.

## Installation

```bash
pip install -r requirements.txt
```

After cloning, place the required local assets in these paths:

```text
ANPR-Traffic-Intelligence/
├── yolo26n.pt
└── models/
    └── number_plate_detection_best.pt
```

The model binaries, videos, datasets, training runs, and generated outputs are intentionally excluded from GitHub because they are large local assets. The notebooks document how the models were developed; they do not retrain models during application use.

## Run the application

```bash
python -m streamlit run app.py
```

The UI accepts uploaded videos or multiple bundled videos from `videos/`. Configure frame stride and an optional frame limit in the sidebar.

## CLI

```bash
python run_pipeline.py --video videos/viofo.mp4 --max-frames 120 --frame-stride 2
```

Add `--no-ocr` for a detector/tracker smoke test.

## Outputs

Results are written under `outputs/app/`:

- `annotated_videos/`: annotated MP4 files with vehicle IDs, plate boxes, OCR labels, and frame numbers.
- `plate_crops/`: detected plate crops.
- `results/`: JSON summaries and CSV vehicle-to-plate records.

The repository does not include the sample videos. Add traffic videos to `videos/` locally, or upload them through the Streamlit interface.

Each vehicle record includes camera, camera-scoped vehicle ID, class, first/last timestamp, plate detection flag, recognized plate or `UNKNOWN`, OCR and plate confidence, best frame, and status.

## Limitations and future improvements

Plate visibility, blur, occlusion, detector confidence, and video quality strongly affect OCR. Unreadable text remains `UNKNOWN`; the application never invents plate numbers. OCR may be unavailable if its model cannot load. The current project provides camera-scoped ByteTrack IDs, not reliable cross-camera identity matching. Future work could add calibrated cross-camera ReID, better plate-specific super-resolution, and GPU deployment.
