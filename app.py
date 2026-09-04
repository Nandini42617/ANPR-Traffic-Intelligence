"""VigilantFlow-style ANPR Traffic Intelligence dashboard."""

from __future__ import annotations

import tempfile
from pathlib import Path

import pandas as pd
import pydeck as pdk
import streamlit as st

from anpr.pipeline import ANPRPipeline, ProcessingResult, save_result
from anpr.association import assign_global_ids
from anpr.multicamera import (
    analytics,
    build_events,
    load_cameras,
    make_alerts,
    route_anomalies,
    trajectory_frame,
)
from config import SETTINGS

st.set_page_config(
    page_title="VigilantFlow | ANPR Traffic Intelligence",
    page_icon="VF",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ---------- Styling ----------
st.markdown(
    """
<style>
:root { --bg:#071019; --panel:#0d1722; --panel2:#111e2b; --line:#223244; --text:#e7eef6; --muted:#8ea1b5; --accent:#42d6ff; --green:#37d39b; --red:#ff5d6c; --yellow:#f5c451; }
.stApp { background: radial-gradient(circle at 20% 0%, #102333 0%, #071019 38%, #050b11 100%); color:var(--text); }
.block-container { max-width: 1500px; padding-top: 1.1rem; padding-bottom: 2rem; }
[data-testid="stSidebar"] { background:#08121c; border-right:1px solid var(--line); }
[data-testid="stMetric"] { background:linear-gradient(145deg,#101d2a,#0b151f); border:1px solid var(--line); border-radius:12px; padding:12px 14px; }
[data-testid="stMetricLabel"] { color:#8ea1b5 !important; }
[data-testid="stMetricValue"] { color:#f1f7fc !important; }
.vf-brand { font-size:1.7rem; font-weight:800; letter-spacing:.5px; }
.vf-sub { color:var(--muted); margin-top:-8px; }
.vf-chip { display:inline-block; padding:4px 9px; border-radius:999px; background:#102736; color:#65ddff; border:1px solid #1e5269; font-size:.72rem; margin-right:5px; }
.vf-live { color:#ff6471; font-weight:800; }
.vf-panel { background:rgba(13,23,34,.88); border:1px solid var(--line); border-radius:14px; padding:14px; margin-bottom:10px; }
.vf-panel-title { font-weight:700; margin-bottom:8px; }
.vf-log { max-height:330px; overflow-y:auto; }
.vf-row { border-bottom:1px solid #1b2a39; padding:9px 4px; }
.vf-small { color:var(--muted); font-size:.76rem; }
div[data-testid="stTabs"] button { color:#aebed0; }
</style>
""",
    unsafe_allow_html=True,
)

# ---------- Helpers ----------
camera_config = Path(__file__).with_name("cameras.json")
cameras = load_cameras(camera_config)


@st.cache_resource(show_spinner=False)
def get_pipeline(frame_stride: int, enable_ocr: bool):
    settings = SETTINGS.__class__(**{**SETTINGS.__dict__, "frame_stride": frame_stride})
    return ANPRPipeline(settings, enable_ocr=enable_ocr), settings


def records_frame(result: ProcessingResult) -> pd.DataFrame:
    rows = []
    for r in result.records or []:
        rows.append(
            {
                "Camera": r.camera,
                "Global Vehicle ID": r.global_vehicle_id,
                "Local Track ID": r.vehicle_id,
                "Class": r.vehicle_class,
                "First Seen (s)": round(r.first_seen, 2),
                "Last Seen (s)": round(r.last_seen, 2),
                "Plate": r.recognized_plate,
                "Plate Detected": r.plate_detected,
                "OCR": r.ocr_backend,
                "OCR Confidence": round(r.ocr_confidence, 3),
                "Plate Confidence": round(r.plate_confidence, 3),
                "Status": r.status,
                "Observations": r.number_of_plate_observations,
                "OCR Attempts": r.ocr_attempts,
                "Distinct Frames": r.distinct_frames_used,
            }
        )
    return pd.DataFrame(rows)


def show_camera_card(result: ProcessingResult, index: int) -> None:
    name = Path(result.input_video).stem
    camera_name = f"Camera {index + 1}"
    st.markdown(
        f"""
        <div class="vf-panel">
          <div class="vf-panel-title">{camera_name} <span class="vf-chip">VIDEO SOURCE</span>
          <span class="vf-live">● ANALYZED</span></div>
          <div class="vf-small">{name}</div>
        </div>
        """,
        unsafe_allow_html=True,
    )
    if result.error:
        st.error(result.error)
    elif result.output_video and Path(result.output_video).exists():
        st.video(result.output_video)
    else:
        st.info("Annotated feed is not available yet.")


def latest_detection_rows(events: pd.DataFrame) -> pd.DataFrame:
    if events.empty:
        return pd.DataFrame()

    df = events.copy()
    # Pick useful columns without assuming a fixed schema.
    candidates = [
        "timestamp",
        "camera_id",
        "normalized_plate",
        "recognized_plate",
        "global_vehicle_id",
        "vehicle_class",
        "confidence",
        "status",
    ]
    cols = [c for c in candidates if c in df.columns]
    if not cols:
        return df.tail(12).copy()

    out = df[cols].tail(12).copy()
    rename = {
        "timestamp": "Time",
        "camera_id": "Camera",
        "normalized_plate": "Plate",
        "recognized_plate": "Plate",
        "global_vehicle_id": "Vehicle ID",
        "vehicle_class": "Class",
        "confidence": "Confidence",
        "status": "Status",
    }
    out = out.rename(columns={k: v for k, v in rename.items() if k in out.columns})
    return out.iloc[::-1]


# ---------- Header ----------
st.markdown('<div class="vf-brand">◉ VigilantFlow <span style="color:#42d6ff">AI</span></div>', unsafe_allow_html=True)
st.markdown(
    '<div class="vf-sub">Intelligent ANPR • Multi-camera tracking • Traffic intelligence • Real-time-style operations dashboard</div>',
    unsafe_allow_html=True,
)

# ---------- Sidebar ----------
with st.sidebar:
    st.markdown("### Control Center")
    uploads = st.file_uploader(
        "Add CCTV / traffic video feeds",
        type=["mp4", "avi", "mov", "mkv"],
        accept_multiple_files=True,
    )

    bundled = sorted(SETTINGS.videos_dir.glob("*.mp4"))
    selected = st.multiselect(
        "Or use project camera feeds",
        [p.name for p in bundled],
    )

    st.divider()
    stride = st.slider("AI inference stride", 1, 5, SETTINGS.frame_stride)
    limit = st.number_input(
        "Frame limit (0 = complete feed)",
        min_value=0,
        value=0,
        step=30,
    )
    use_ocr = st.checkbox("EasyOCR fallback", True)

    start = st.button(
        "START AI MONITORING",
        type="primary",
        use_container_width=True,
    )

    if st.button("Clear dashboard", use_container_width=True):
        for key in ("results", "events", "alerts", "anomalies"):
            st.session_state.pop(key, None)
        st.rerun()

# ---------- Processing ----------
if start:
    sources = []

    for upload in uploads or []:
        temp = tempfile.NamedTemporaryFile(
            delete=False,
            suffix=Path(upload.name).suffix or ".mp4",
        )
        temp.write(upload.getbuffer())
        temp.close()
        sources.append((Path(temp.name), upload.name))

    sources.extend(
        (SETTINGS.videos_dir / name, name)
        for name in selected
    )

    if not sources:
        st.warning("Upload at least one traffic video or choose a project feed.")
    else:
        settings = SETTINGS.__class__(
            **{**SETTINGS.__dict__, "frame_stride": stride}
        )
        all_results: list[ProcessingResult] = []
        progress = st.progress(0, text="Loading AI models...")

        try:
            pipeline, settings = get_pipeline(stride, use_ocr)

            for index, (source, display_name) in enumerate(sources):
                output = (
                    settings.output_dir
                    / "annotated_videos"
                    / f"{Path(display_name).stem}_processed.mp4"
                )
                output.parent.mkdir(parents=True, exist_ok=True)

                result = pipeline.process_video(
                    source,
                    output,
                    max_frames=int(limit) or None,
                    progress=lambda done, total, i=index: progress.progress(
                        min(
                            (i + done / max(total, 1)) / len(sources),
                            1.0,
                        ),
                        text=f"Analyzing {display_name}: frame {done}/{total}",
                    ),
                )
                all_results.append(result)

            progress.progress(1.0, text="AI monitoring completed")
            assign_global_ids(all_results)

            for completed in all_results:
                save_result(
                    completed,
                    settings.output_dir / "results",
                )

            events = build_events(all_results, cameras)
            alerts = make_alerts(
                events,
                Path(__file__).with_name("blacklist.json"),
            )
            anomalies = route_anomalies(events)

            out = settings.output_dir / "results"
            out.mkdir(parents=True, exist_ok=True)
            events.to_csv(out / "vehicle_events.csv", index=False)
            alerts.to_csv(out / "alerts.csv", index=False)
            anomalies.to_csv(out / "route_anomalies.csv", index=False)

            st.session_state.update(
                results=all_results,
                events=events,
                alerts=alerts,
                anomalies=anomalies,
            )
            st.rerun()

        except Exception as exc:
            st.error(f"Processing failed: {exc}")

# ---------- Dashboard ----------
results: list[ProcessingResult] = st.session_state.get("results", [])
events: pd.DataFrame = st.session_state.get("events", pd.DataFrame())
alerts: pd.DataFrame = st.session_state.get("alerts", pd.DataFrame())
anomalies: pd.DataFrame = st.session_state.get("anomalies", pd.DataFrame())

if not results:
    st.markdown(
        """
        <div class="vf-panel" style="text-align:center;padding:55px 20px;">
          <div style="font-size:3rem;">◉</div>
          <h2>Traffic Intelligence Command Center</h2>
          <p style="color:#8ea1b5;">
            Add one or more CCTV feeds from the left panel to activate
            vehicle detection, number-plate OCR, cross-camera identity,
            alerts, trajectories and analytics.
          </p>
        </div>
        """,
        unsafe_allow_html=True,
    )
    st.stop()

summary = analytics(events)

# KPI row
kpi = st.columns(6)
kpi[0].metric("TOTAL VEHICLES", summary["total_unique_vehicles"])
kpi[1].metric("DETECTIONS", summary["total_observations"])
kpi[2].metric("PLATES READ", summary["plate_recognized"])
kpi[3].metric("LOW / UNREAD", summary["plate_unreadable"])
kpi[4].metric("CAMERAS", events.camera_id.nunique() if not events.empty else 0)
kpi[5].metric("ACTIVE ALERTS", len(alerts) + len(anomalies))

st.write("")

# Main command-center view
feed_col, log_col = st.columns([3.25, 1.25], gap="medium")

with feed_col:
    st.markdown(
        '<div class="vf-panel-title">LIVE DETECTION FEEDS <span class="vf-chip">AI VISION</span></div>',
        unsafe_allow_html=True,
    )

    feed_cols = st.columns(min(3, max(1, len(results))))
    for i, result in enumerate(results):
        with feed_cols[i % len(feed_cols)]:
            show_camera_card(result, i)

with log_col:
    st.markdown(
        '<div class="vf-panel-title">LIVE DETECTION LOG</div>',
        unsafe_allow_html=True,
    )

    log = latest_detection_rows(events)
    if log.empty:
        st.info("No detections yet.")
    else:
        st.dataframe(
            log,
            use_container_width=True,
            hide_index=True,
            height=430,
        )

st.divider()

tab1, tab2, tab3, tab4 = st.tabs(
    ["TRAJECTORY", "ANALYTICS", "ALERTS", "ANPR RECORDS"]
)

# ---------- Trajectory ----------
with tab1:
    st.subheader("Cross-camera vehicle trajectory")
    query = st.text_input(
        "Search recognized plate or global vehicle ID",
        key="trajectory_plate",
        placeholder="e.g. DL01AB1234",
    ).strip()

    if query:
        route = trajectory_frame(events, query)

        if route.empty:
            st.warning("No reliable observation found for that vehicle.")
        else:
            c1, c2, c3 = st.columns(3)
            c1.metric("GLOBAL ID", str(route.global_vehicle_id.iloc[0]))
            c2.metric("CAMERAS VISITED", len(route))
            c3.metric(
                "EST. MAX SPEED",
                f"{route.estimated_speed_kmh.max():.1f} km/h"
                if "estimated_speed_kmh" in route.columns
                and not route.estimated_speed_kmh.dropna().empty
                else "N/A",
            )

            display_cols = [
                c
                for c in [
                    "camera_id",
                    "timestamp",
                    "normalized_plate",
                    "time_to_next_s",
                    "distance_to_next_km",
                    "distance_type",
                    "estimated_speed_kmh",
                ]
                if c in route.columns
            ]
            st.dataframe(
                route[display_cols],
                use_container_width=True,
                hide_index=True,
            )

            points = route.dropna(subset=["latitude", "longitude"])
            if not points.empty:
                layers = [
                    pdk.Layer(
                        "ScatterplotLayer",
                        points,
                        get_position="[longitude, latitude]",
                        get_radius=90,
                        get_fill_color=[66, 214, 255],
                        pickable=True,
                    )
                ]
                if len(points) >= 2:
                    layers.append(
                        pdk.Layer(
                            "PathLayer",
                            [
                                {
                                    "path": points[
                                        ["longitude", "latitude"]
                                    ].values.tolist()
                                }
                            ],
                            get_path="path",
                            get_width=6,
                            get_color=[55, 211, 155],
                        )
                    )

                st.pydeck_chart(
                    pdk.Deck(
                        layers=layers,
                        initial_view_state=pdk.ViewState(
                            latitude=float(points.latitude.mean()),
                            longitude=float(points.longitude.mean()),
                            zoom=12,
                        ),
                        tooltip={"text": "Camera: {camera_id}"},
                    ),
                    use_container_width=True,
                )

# ---------- Analytics ----------
with tab2:
    a = analytics(events)
    left, right = st.columns(2)

    with left:
        st.subheader("Vehicles by class")
        st.bar_chart(
            pd.DataFrame(
                list(a["by_class"].items()),
                columns=["vehicle_class", "count"],
            ).set_index("vehicle_class")
        )

    with right:
        st.subheader("Traffic load by camera")
        if not a["load"].empty:
            st.bar_chart(
                a["load"].set_index(
                    a["load"].columns[0]
                )
            )

    st.subheader("Origin → destination transitions")
    st.dataframe(a["od"], use_container_width=True, hide_index=True)

    if not a["hourly"].empty:
        st.subheader("Traffic intensity by hour")
        st.line_chart(a["hourly"].set_index("hour"))

    if not events.empty:
        heat = (
            events.groupby(
                ["camera_id", "latitude", "longitude"],
                dropna=False,
            )
            .size()
            .reset_index(name="traffic_count")
            .dropna(subset=["latitude", "longitude"])
        )

        if not heat.empty:
            st.subheader("Traffic heatmap")
            st.pydeck_chart(
                pdk.Deck(
                    layers=[
                        pdk.Layer(
                            "HeatmapLayer",
                            heat,
                            get_position="[longitude, latitude]",
                            get_weight="traffic_count",
                            radius_pixels=55,
                        )
                    ],
                    initial_view_state=pdk.ViewState(
                        latitude=float(heat.latitude.mean()),
                        longitude=float(heat.longitude.mean()),
                        zoom=11,
                    ),
                ),
                use_container_width=True,
            )

# ---------- Alerts ----------
with tab3:
    if alerts.empty and anomalies.empty:
        st.success("No blacklist alerts or route anomalies detected.")
    else:
        if not alerts.empty:
            st.error(f"BLACKLIST ALERTS: {len(alerts)}")
            st.dataframe(
                alerts,
                use_container_width=True,
                hide_index=True,
            )

        if not anomalies.empty:
            st.warning(f"ROUTE ANOMALIES: {len(anomalies)}")
            st.dataframe(
                anomalies,
                use_container_width=True,
                hide_index=True,
            )

    alert_export = pd.concat(
        [alerts, anomalies],
        ignore_index=True,
    )
    st.download_button(
        "Download alert report",
        alert_export.to_csv(index=False).encode(),
        "vigilantflow_alerts.csv",
        "text/csv",
    )

# ---------- ANPR records ----------
with tab4:
    for index, result in enumerate(results):
        st.markdown(f"### Camera {index + 1} — {Path(result.input_video).name}")

        if result.error:
            st.error(result.error)

        frame = records_frame(result)

        if frame.empty:
            st.info("No vehicle/plate records were generated.")
        else:
            st.dataframe(
                frame,
                use_container_width=True,
                hide_index=True,
            )

            st.download_button(
                "Download camera CSV",
                frame.to_csv(index=False).encode(),
                f"{Path(result.input_video).stem}_records.csv",
                "text/csv",
                key=f"csv-{index}-{result.input_video}",
            )

# ---------- Downloads ----------
st.divider()
d1, d2, d3 = st.columns(3)

with d1:
    st.download_button(
        "Download vehicle events CSV",
        events.to_csv(index=False).encode(),
        "vehicle_events.csv",
        "text/csv",
    )

with d2:
    annotated = [
        r for r in results
        if r.output_video and Path(r.output_video).exists()
    ]
    if annotated:
        r = annotated[0]
        st.download_button(
            "Download annotated video",
            Path(r.output_video).read_bytes(),
            Path(r.output_video).name,
            "video/mp4",
        )

with d3:
    st.caption(
        "Global IDs are plate-backed. UNKNOWN vehicles remain "
        "camera-scoped unless appearance ReID is enabled."
    )

