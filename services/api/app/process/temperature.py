from __future__ import annotations

import json
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
from PIL import Image

from app.config import settings


def _time_dir(valid_time: str) -> Path:
    safe = valid_time.replace(":", "-")
    d = settings.processed_dir / safe
    d.mkdir(parents=True, exist_ok=True)
    return d


def write_temperature_assets(
    valid_time: str,
    t2m_k: np.ndarray,
    bounds: list[float],
) -> Path:
    """Render 2m temperature (Kelvin) to PNG + meta JSON."""
    tdir = _time_dir(valid_time)
    t_c = t2m_k - 273.15
    vmin, vmax = float(np.nanmin(t_c)), float(np.nanmax(t_c))

    norm = (t_c - vmin) / max(vmax - vmin, 1e-6)
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
        "min_c": vmin,
        "max_c": vmax,
        "unit": "celsius",
    }
    meta_path = tdir / "temperature.meta.json"
    meta_path.write_text(json.dumps(meta, indent=2), encoding="utf-8")
    return png_path
