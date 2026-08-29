"""Demo-ready Streamlit UI for ANPR Traffic AI."""
from __future__ import annotations
import tempfile
from pathlib import Path
import pandas as pd
import streamlit as st
from anpr.pipeline import ANPRPipeline, ProcessingResult, save_result
from config import SETTINGS

st.set_page_config(page_title="ANPR Traffic AI", page_icon="🚦", layout="wide")
st.title("ANPR Traffic AI")
st.caption("Automatic Number Plate Recognition & Traffic Analysis")

with st.sidebar:
    st.header("Input videos")
    uploads = st.file_uploader("Upload one or more traffic videos", type=["mp4", "avi", "mov", "mkv"], accept_multiple_files=True)
    bundled = sorted(SETTINGS.videos_dir.glob("*.mp4"))
    selected = st.multiselect("Or choose project videos", [p.name for p in bundled])
    stride = st.slider("Inference frame stride", 1, 5, SETTINGS.frame_stride)
    limit = st.number_input("Processing frame limit (0 = full video)", min_value=0, value=0, step=30)
    use_ocr = st.checkbox("Enable EasyOCR", True)
    start = st.button("Start Processing", type="primary", use_container_width=True)

if start:
    sources = []
    for upload in uploads or []:
        temp = tempfile.NamedTemporaryFile(delete=False, suffix=Path(upload.name).suffix or ".mp4")
        temp.write(upload.getbuffer()); temp.close(); sources.append((Path(temp.name), upload.name))
    sources.extend((SETTINGS.videos_dir / name, name) for name in selected)
    if not sources:
        st.warning("Upload a video or select one from the project videos.")
    else:
        settings = SETTINGS.__class__(**{**SETTINGS.__dict__, "frame_stride": stride})
        all_results: list[ProcessingResult] = []
        progress = st.progress(0, text="Loading models…")
        try:
            pipeline = ANPRPipeline(settings, enable_ocr=use_ocr)
            for index, (source, display_name) in enumerate(sources):
                output = settings.output_dir / "annotated_videos" / f"{Path(display_name).stem}_processed.mp4"
                st.write(f"Processing **{display_name}**…")
                result = pipeline.process_video(source, output, max_frames=int(limit) or None, progress=lambda done, total, i=index: progress.progress(min((i + done / max(total, 1)) / len(sources), 1.0), text=f"Processing {display_name}: frame {done}/{total}"))
                save_result(result, settings.output_dir / "results"); all_results.append(result)
            progress.progress(1.0, text="Completed")
            st.session_state["results"] = all_results
        except Exception as exc:
            st.error(f"Processing could not start: {exc}")

results: list[ProcessingResult] = st.session_state.get("results", [])
if results:
    if any(r.error for r in results): st.warning("One or more videos had processing errors; other results remain available.")
    total_vehicles = sum(r.tracked_vehicles for r in results); total_plates = sum(r.plates_detected for r in results); total_recognized = sum(r.recognized_plates for r in results)
    st.subheader("Results")
    cols = st.columns(4)
    cols[0].metric("Total Vehicles", total_vehicles); cols[1].metric("Plates Detected", total_plates); cols[2].metric("Plates Recognized", total_recognized); cols[3].metric("OCR Success Rate", f"{total_recognized / total_plates:.0%}" if total_plates else "0%")
    for result in results:
        st.markdown(f"#### {result.input_video}")
        if result.error: st.error(result.error)
        elif result.output_video and Path(result.output_video).exists():
            st.video(result.output_video)
            st.download_button("Download annotated video", Path(result.output_video).read_bytes(), file_name=Path(result.output_video).name, mime="video/mp4", key=f"video-{result.input_video}")
        rows = [{"Camera":r.camera,"Vehicle ID":r.vehicle_id,"Vehicle Class":r.vehicle_class,"First Seen (s)":round(r.first_seen,2),"Last Seen (s)":round(r.last_seen,2),"Plate Detected":r.plate_detected,"Recognized Plate":r.recognized_plate,"OCR Confidence":round(r.ocr_confidence,3),"Plate Confidence":round(r.plate_confidence,3),"Best Frame":r.best_frame,"Status":r.status} for r in (result.records or [])]
        frame = pd.DataFrame(rows)
        st.dataframe(frame, use_container_width=True, hide_index=True)
        st.download_button("Download CSV", frame.to_csv(index=False).encode("utf-8"), file_name=f"{Path(result.input_video).stem}_records.csv", mime="text/csv", key=f"csv-{result.input_video}")
        if result.plates_detected == 0: st.info("No plates detected in this video.")
        elif result.recognized_plates == 0: st.info("Plates were detected, but OCR could not confidently recognize any text.")
        if any(record.status == "OCR Unavailable" for record in (result.records or [])):
            st.warning("OCR was unavailable for some vehicles; those records remain UNKNOWN.")
    st.info("Vehicle IDs are camera-specific ByteTrack IDs (for example, CAM-V12). The current notebooks do not implement reliable cross-camera ReID.")
