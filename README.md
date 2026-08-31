# ANPR Traffic AI

Demo-ready automatic number-plate recognition and traffic analysis built around the project notebooks and trained weights.

## Notebook-to-production mapping

- Notebook 01: vehicle detection dataset and model development.
- Notebook 02: Gujarat vehicle number-plate detection dataset and training.
- Notebook 03: EasyOCR preprocessing and plate-text recognition.
- Notebook 04: multi-camera vehicle tracking, plate association, and OCR.
- Production uses `yolo26n.pt` for vehicle detection and `models/number_plate_detection_best.pt` for plate detection.

## Installation

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## Project Data

Included source assets:

- `vechile_detection/` (including its root image/label files and `yolo_dataset/`): vehicle detection dataset for Notebook 01.
- `number_plate_detection/Gujarat_Vehicle_Dataset/`: plate detection dataset for Notebook 02.
- `plate_ocr/images/`: OCR dataset for Notebook 03.
- `videos/cam_1.mp4`, `videos/North-East.mp4`, and `videos/viofo.mp4`: test/demo videos for Notebook 04 and application testing.
- `yolo26n.pt`, `models/vehicle_detection_best.pt`, and `models/number_plate_detection_best.pt`: required model weights.

Generated outputs are excluded because they can be regenerated: `outputs/`,
`runs/`, notebook checkpoints, plate crops, debug images, processed videos,
caches, and Python bytecode.

## Reproduce the Project

```powershell
git clone https://github.com/ka0913560-hub/ANPR-Traffic-Intelligence.git
cd ANPR-Traffic-Intelligence
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Verify that `vechile_detection/`, `number_plate_detection/`, `plate_ocr/`,
`videos/`, `yolo26n.pt`, and both files under `models/` exist. Notebooks use
project-relative paths based on the notebook directory. Run notebooks 01–04
in order when reproducing experiments. Notebook 04 uses `videos/viofo.mp4`
by default and writes regenerable artifacts under `outputs/`.

## Run the application

```powershell
python -m streamlit run app.py
```

The UI accepts uploads or bundled videos from `videos/`.

## CLI

```powershell
python run_pipeline.py --video videos/viofo.mp4 --max-frames 120 --frame-stride 2
```

Add `--no-ocr` for a detector/tracker smoke test. Results are written under
`outputs/app/` as annotated videos, plate crops, JSON summaries, and CSV files.

## Limitations

Unreadable text remains `UNKNOWN`; the application never invents plate numbers.
Vehicle IDs are camera-scoped ByteTrack IDs, not reliable cross-camera identity matching.
