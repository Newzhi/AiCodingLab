from __future__ import annotations

import json
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
from PIL import Image

from app.config import settings

# Fixed color scale for geographically meaningful coloring (poles cold, tropics warm).
COLOR_SCALE_MIN_C = -40.0
COLOR_SCALE_MAX_C = 40.0


def _time_dir(valid_time: str) -> Path:
    safe = valid_time.replace(":", "-")
    d = settings.processed_dir / safe
    d.mkdir(parents=True, exist_ok=True)
    return d


def write_temperature_assets(
    valid_time: str,
    t2m_k: np.ndarray,
    bounds: list[float],
    lats: np.ndarray | None = None,
) -> Path:
    """Render 2m temperature (Kelvin) to north-up PNG + meta JSON."""
    tdir = _time_dir(valid_time)
    t_c = np.asarray(t2m_k, dtype=float) - 273.15

    # Ensure row 0 = northernmost latitude (Cesium north-up imagery).
    if lats is not None and len(lats) > 1 and float(lats[0]) < float(lats[-1]):
        t_c = np.flipud(t_c)

    data_min, data_max = float(np.nanmin(t_c)), float(np.nanmax(t_c))

    span = COLOR_SCALE_MAX_C - COLOR_SCALE_MIN_C
    norm = (t_c - COLOR_SCALE_MIN_C) / max(span, 1e-6)
    cmap = plt.get_cmap("coolwarm")
    rgba = cmap(np.clip(norm, 0, 1))
    rgba = (rgba * 255).astype(np.uint8)
    rgba[..., 3] = 255

    img = Image.fromarray(rgba, mode="RGBA")
    png_path = tdir / "temperature.png"
    img.save(png_path, format="PNG")

    meta = {
        "valid_time": valid_time,
        "bounds": bounds,
        "min_c": data_min,
        "max_c": data_max,
        "color_scale_min_c": COLOR_SCALE_MIN_C,
        "color_scale_max_c": COLOR_SCALE_MAX_C,
        "unit": "celsius",
    }
    meta_path = tdir / "temperature.meta.json"
    meta_path.write_text(json.dumps(meta, indent=2), encoding="utf-8")
    return png_path
