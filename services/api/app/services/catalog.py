from __future__ import annotations

import json
from pathlib import Path

from app.config import settings

LAYER_FILES: dict[str, dict[str, str]] = {
    "temperature": {
        "texture": "temperature.png",
        "meta": "temperature.meta.json",
    },
    "isobars": {
        "geojson": "isobars.geojson",
    },
    "wind": {
        "meta": "wind.uv.json",
        "binary": "wind.uv.bin",
    },
    "ocean": {
        "meta": "ocean.uv.json",
        "binary": "ocean.uv.bin",
    },
}


def _time_dir(valid_time: str) -> Path:
    safe = valid_time.replace(":", "-")
    return settings.processed_dir / safe


def list_valid_times() -> list[str]:
    times: list[str] = []
    if not settings.processed_dir.exists():
        return times
    for entry in sorted(settings.processed_dir.iterdir()):
        if not entry.is_dir():
            continue
        meta = entry / "manifest.json"
        if meta.exists():
            data = json.loads(meta.read_text(encoding="utf-8"))
            times.append(data.get("valid_time", entry.name))
        elif (entry / "temperature.png").exists():
            # folder name uses dashes instead of colons
            name = entry.name
            if "T" in name and name.count("-") >= 3:
                parts = name.split("T")
                date = parts[0]
                rest = parts[1].replace("-", ":")
                times.append(f"{date}T{rest}")
            else:
                times.append(name)
    return sorted(times)


def get_layer_assets(valid_time: str, layer_id: str) -> dict:
    if layer_id not in LAYER_FILES:
        raise FileNotFoundError(f"Unknown layer: {layer_id}")

    tdir = _time_dir(valid_time)
    if not tdir.exists():
        raise FileNotFoundError(f"No data for valid_time={valid_time}")

    safe_time = valid_time.replace(":", "-")
    base_url = f"/static/processed/{safe_time}"
    files: dict[str, str] = {}
    for key, fname in LAYER_FILES[layer_id].items():
        path = tdir / fname
        if not path.exists():
            raise FileNotFoundError(f"Missing {fname} for {layer_id} at {valid_time}")
        files[key] = f"{base_url}/{fname}"

    return {
        "valid_time": valid_time,
        "layer_id": layer_id,
        "files": files,
    }
