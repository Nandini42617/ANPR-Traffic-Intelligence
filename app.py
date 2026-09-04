def latest_detection_rows(events: pd.DataFrame) -> pd.DataFrame:
    if events.empty:
        return pd.DataFrame()

    df = events.copy()

    # Avoid duplicate output column names.
    # Prefer normalized_plate, otherwise use recognized_plate.
    if "normalized_plate" in df.columns:
        df["Plate"] = df["normalized_plate"]
    elif "recognized_plate" in df.columns:
        df["Plate"] = df["recognized_plate"]

    candidates = [
        "timestamp",
        "camera_id",
        "Plate",
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
        "global_vehicle_id": "Vehicle ID",
        "vehicle_class": "Class",
        "confidence": "Confidence",
        "status": "Status",
    }

    out = out.rename(
        columns={k: v for k, v in rename.items() if k in out.columns}
    )

    # Final safety check: remove any duplicate column names.
    out = out.loc[:, ~out.columns.duplicated()]

    return out.iloc[::-1]