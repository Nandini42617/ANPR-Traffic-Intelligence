"""CLI smoke/end-to-end runner for the ANPR pipeline."""
import argparse, logging
from pathlib import Path
from anpr.pipeline import ANPRPipeline, save_result
from config import SETTINGS

def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--video", required=True)
    parser.add_argument("--max-frames", type=int)
    parser.add_argument("--frame-stride", type=int, default=SETTINGS.frame_stride)
    parser.add_argument("--no-ocr", action="store_true")
    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    settings = SETTINGS.__class__(**{**SETTINGS.__dict__, "frame_stride": args.frame_stride})
    result = ANPRPipeline(settings, enable_ocr=not args.no_ocr).process_video(args.video, settings.output_dir / "annotated_videos" / f"{Path(args.video).stem}_processed.mp4", max_frames=args.max_frames)
    save_result(result, settings.output_dir / "results")
    print(result)

if __name__ == "__main__": main()
