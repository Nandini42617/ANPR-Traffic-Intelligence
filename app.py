"""Streamlit ANPR, multi-camera trajectory, traffic analytics and alerts dashboard."""
from __future__ import annotations
import tempfile
from pathlib import Path
import pandas as pd
import streamlit as st
import pydeck as pdk
from anpr.pipeline import ANPRPipeline, ProcessingResult, save_result
from anpr.association import assign_global_ids
from anpr.multicamera import load_cameras, build_events, trajectory_frame, analytics, make_alerts, route_anomalies
from config import SETTINGS

st.set_page_config(page_title="ANPR Traffic AI", page_icon="🚦", layout="wide")
st.title("ANPR Traffic AI")
st.caption("ANPR • cross-camera plate-backed identity • GIS • traffic analytics")
camera_config = Path(__file__).with_name("cameras.json")
cameras = load_cameras(camera_config)

@st.cache_resource(show_spinner=False)
def get_pipeline(frame_stride: int, enable_ocr: bool):
    settings = SETTINGS.__class__(**{**SETTINGS.__dict__, "frame_stride": frame_stride})
    return ANPRPipeline(settings, enable_ocr=enable_ocr), settings

with st.sidebar:
    st.header("Input videos")
    uploads = st.file_uploader("Upload one or more traffic videos", type=["mp4", "avi", "mov", "mkv"], accept_multiple_files=True)
    bundled = sorted(SETTINGS.videos_dir.glob("*.mp4"))
    selected = st.multiselect("Or choose project videos", [p.name for p in bundled])
    stride = st.slider("Inference frame stride", 1, 5, SETTINGS.frame_stride)
    limit = st.number_input("Processing frame limit (0 = full video)", min_value=0, value=0, step=30)
    use_ocr = st.checkbox("Enable EasyOCR fallback", True)
    start = st.button("Start Processing", type="primary", use_container_width=True)
    st.caption("Camera coordinates are DEMO/CONFIGURABLE. Edit cameras.json with surveyed values.")

if start:
    sources = []
    for upload in uploads or []:
        temp = tempfile.NamedTemporaryFile(delete=False, suffix=Path(upload.name).suffix or ".mp4")
        temp.write(upload.getbuffer()); temp.close(); sources.append((Path(temp.name), upload.name))
    sources.extend((SETTINGS.videos_dir / name, name) for name in selected)
    if not sources: st.warning("Upload a video or select one from the project videos.")
    else:
        settings = SETTINGS.__class__(**{**SETTINGS.__dict__, "frame_stride": stride})
        all_results: list[ProcessingResult] = []; progress = st.progress(0, text="Loading models…")
        try:
            pipeline, settings = get_pipeline(stride, use_ocr)
            for index, (source, display_name) in enumerate(sources):
                output = settings.output_dir / "annotated_videos" / f"{Path(display_name).stem}_processed.mp4"
                st.write(f"Processing **{display_name}**…")
                result = pipeline.process_video(source, output, max_frames=int(limit) or None, progress=lambda done, total, i=index: progress.progress(min((i + done / max(total, 1)) / len(sources), 1.0), text=f"Processing {display_name}: frame {done}/{total}"))
                all_results.append(result)
            progress.progress(1.0, text="Completed")
            assign_global_ids(all_results)
            for completed in all_results: save_result(completed, settings.output_dir / "results")
            events = build_events(all_results, cameras)
            alerts = make_alerts(events, Path(__file__).with_name("blacklist.json")); anomalies = route_anomalies(events)
            out = settings.output_dir / "results"; out.mkdir(parents=True, exist_ok=True)
            events.to_csv(out / "vehicle_events.csv", index=False); alerts.to_csv(out / "alerts.csv", index=False); anomalies.to_csv(out / "route_anomalies.csv", index=False)
            st.session_state.update(results=all_results, events=events, alerts=alerts, anomalies=anomalies)
        except Exception as exc: st.error(f"Processing could not start: {exc}")

results: list[ProcessingResult] = st.session_state.get("results", [])
events: pd.DataFrame = st.session_state.get("events", pd.DataFrame())
if results:
    summary = analytics(events); alerts = st.session_state.get("alerts", pd.DataFrame()); anomalies = st.session_state.get("anomalies", pd.DataFrame())
    cols = st.columns(6)
    cols[0].metric("Total Vehicles", summary["total_unique_vehicles"]); cols[1].metric("Observations", summary["total_observations"]); cols[2].metric("Recognized Plates", summary["plate_recognized"]); cols[3].metric("Unreadable / Low", summary["plate_unreadable"]); cols[4].metric("Cameras", events.camera_id.nunique() if not events.empty else 0); cols[5].metric("Alerts", len(alerts) + len(anomalies))
    if any(r.error for r in results): st.warning("One or more videos had processing errors; other results remain available.")

    st.subheader("Camera network")
    camera_rows = pd.DataFrame([{"camera_id": c.camera_id, "camera_name": c.camera_name, "location": c.location, "direction": c.direction, "latitude": c.latitude, "longitude": c.longitude} for c in cameras])
    if not camera_rows.empty:
        coords = camera_rows.dropna(subset=["latitude", "longitude"])
        if not coords.empty: st.map(coords, latitude="latitude", longitude="longitude", size=100)
        st.dataframe(camera_rows, use_container_width=True, hide_index=True)

    st.subheader("Vehicle trajectory")
    query = st.text_input("Enter recognized plate or global vehicle ID", key="trajectory_plate").strip()
    if query:
        route = trajectory_frame(events, query)
        if route.empty: st.info("No reliable observation for that plate in the processed videos.")
        else:
            st.write(f"Global vehicle: **{route.global_vehicle_id.iloc[0]}** • cameras visited: **{len(route)}**")
            display_cols = [c for c in ["camera_id", "timestamp", "normalized_plate", "time_to_next_s", "distance_to_next_km", "distance_type", "estimated_speed_kmh"] if c in route]
            st.dataframe(route[display_cols], use_container_width=True, hide_index=True)
            points = route.dropna(subset=["latitude", "longitude"])
            if len(points) >= 1:
                layers = [pdk.Layer("ScatterplotLayer", points, get_position="[longitude, latitude]", get_radius=80, get_fill_color=[220, 40, 40], pickable=True)]
                if len(points) >= 2: layers.append(pdk.Layer("PathLayer", [{"path": points[["longitude", "latitude"]].values.tolist()}], get_path="path", get_width=5, get_color=[30, 100, 220]))
                st.pydeck_chart(pdk.Deck(layers=layers, initial_view_state=pdk.ViewState(latitude=float(points.latitude.mean()), longitude=float(points.longitude.mean()), zoom=12), tooltip={"text": "Camera: {camera_id}"}))

    st.subheader("Traffic analytics")
    a = analytics(events); left, right = st.columns(2)
    with left: st.write("Vehicles by class"); st.dataframe(pd.DataFrame(list(a["by_class"].items()), columns=["vehicle_class", "count"]), hide_index=True, use_container_width=True)
    with right: st.write("Traffic load by camera"); st.dataframe(a["load"], hide_index=True, use_container_width=True)
    st.write("Origin → destination transitions (reliable plate-backed identities only)"); st.dataframe(a["od"], hide_index=True, use_container_width=True)
    if not a["hourly"].empty: st.line_chart(a["hourly"].set_index("hour"))
    if not events.empty:
        heat = events.groupby(["camera_id", "latitude", "longitude"], dropna=False).size().reset_index(name="traffic_count").dropna(subset=["latitude", "longitude"])
        if not heat.empty:
            st.write("Traffic heatmap (actual processed observations)")
            st.pydeck_chart(pdk.Deck(layers=[pdk.Layer("HeatmapLayer", heat, get_position="[longitude, latitude]", get_weight="traffic_count", radius_pixels=55)], initial_view_state=pdk.ViewState(latitude=float(heat.latitude.mean()), longitude=float(heat.longitude.mean()), zoom=11)))

    st.subheader("Alerts")
    if alerts.empty and anomalies.empty: st.info("No blacklist alerts or route anomalies. Insufficient data is not treated as suspicious.")
    if not alerts.empty: st.error("Blacklist alerts"); st.dataframe(alerts, use_container_width=True, hide_index=True)
    if not anomalies.empty: st.warning("Route anomalies"); st.dataframe(anomalies, use_container_width=True, hide_index=True)
    st.download_button("Download centralized vehicle events CSV", events.to_csv(index=False).encode(), "vehicle_events.csv", "text/csv")
    st.download_button("Download alerts CSV", pd.concat([alerts, anomalies], ignore_index=True).to_csv(index=False).encode(), "alerts.csv", "text/csv")

    st.subheader("ANPR results")
    for result in results:
        st.markdown(f"#### {result.input_video}")
        if result.error: st.error(result.error)
        elif result.output_video and Path(result.output_video).exists():
            st.video(result.output_video)
            st.download_button("Download annotated video", Path(result.output_video).read_bytes(), Path(result.output_video).name, "video/mp4", key=f"video-{result.input_video}")
        rows = [{"Camera":r.camera,"Global Vehicle ID":r.global_vehicle_id,"Local Track ID":r.vehicle_id,"Vehicle Class":r.vehicle_class,"First Seen (s)":round(r.first_seen,2),"Last Seen (s)":round(r.last_seen,2),"Plate Detected":r.plate_detected,"Recognized Plate":r.recognized_plate,"OCR Backend":r.ocr_backend,"OCR Confidence":round(r.ocr_confidence,3),"Plate Confidence":round(r.plate_confidence,3),"Best Frame":r.best_frame,"Status":r.status,"Plate Observations":r.number_of_plate_observations,"OCR Attempts":r.ocr_attempts,"Distinct Frames":r.distinct_frames_used} for r in (result.records or [])]
        frame = pd.DataFrame(rows); st.dataframe(frame, use_container_width=True, hide_index=True)
        st.download_button("Download CSV", frame.to_csv(index=False).encode(), f"{Path(result.input_video).stem}_records.csv", "text/csv", key=f"csv-{result.input_video}")
        if result.plates_detected == 0: st.info("No plates detected in this video.")
    st.info("Global IDs are plate-backed. UNKNOWN vehicles remain camera-scoped because appearance ReID is not enabled.")
