from __future__ import annotations

import json
import struct
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
from PIL import Image

from app.config import settings

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
    """Render 2m temperature (Kelvin) to north-up PNG + grid binary + meta JSON."""
    tdir = _time_dir(valid_time)
    t_c = np.asarray(t2m_k, dtype=float) - 273.15

    if lats is not None and len(lats) > 1 and float(lats[0]) < float(lats[-1]):
        t_c = np.flipud(t_c)

    data_min, data_max = float(np.nanmin(t_c)), float(np.nanmax(t_c))
    height, width = t_c.shape

    span = COLOR_SCALE_MAX_C - COLOR_SCALE_MIN_C
    norm = (t_c - COLOR_SCALE_MIN_C) / max(span, 1e-6)
    cmap = plt.get_cmap("coolwarm")
    rgba = cmap(np.clip(norm, 0, 1))
    rgba = (rgba * 255).astype(np.uint8)
    rgba[..., 3] = 255

    img = Image.fromarray(rgba, mode="RGBA")
    png_path = tdir / "temperature.png"
    img.save(png_path, format="PNG")

    grid_path = tdir / "temperature.grid.bin"
    grid_path.write_bytes(t_c.astype(np.float32).ravel().tobytes())

    meta = {
        "valid_time": valid_time,
        "bounds": bounds,
        "width": width,
        "height": height,
        "min_c": data_min,
        "max_c": data_max,
        "color_scale_min_c": COLOR_SCALE_MIN_C,
        "color_scale_max_c": COLOR_SCALE_MAX_C,
        "unit": "celsius",
        "grid": "temperature.grid.bin",
    }
    meta_path = tdir / "temperature.meta.json"
    meta_path.write_text(json.dumps(meta, indent=2), encoding="utf-8")
    return png_path


def read_temperature_grid(valid_time: str) -> tuple[np.ndarray, dict] | None:
    """Load float32 celsius grid (north-up) and meta for point sampling."""
    tdir = _time_dir(valid_time)
    meta_path = tdir / "temperature.meta.json"
    grid_path = tdir / "temperature.grid.bin"
    if not meta_path.exists() or not grid_path.exists():
        return None
    meta = json.loads(meta_path.read_text(encoding="utf-8"))
    width = int(meta["width"])
    height = int(meta["height"])
    raw = grid_path.read_bytes()
    grid = np.frombuffer(raw, dtype=np.float32).reshape(height, width)
    return grid, meta


def sample_temperature_bilinear(
    grid: np.ndarray,
    meta: dict,
    lat: float,
    lon: float,
) -> float | None:
    """Bilinear sample from north-up grid; returns °C or None if out of bounds."""
    west, south, east, north = meta["bounds"]
    lon = ((lon + 180) % 360) - 180
    if lat < south or lat > north or lon < west or lon > east:
        return None

    height, width = grid.shape
    if width <= 1 or height <= 1:
        return float(grid[0, 0])

    x = (lon - west) / (east - west) * (width - 1)
    y = (north - lat) / (north - south) * (height - 1)

    x0 = int(np.floor(x))
    x1 = min(x0 + 1, width - 1)
    y0 = int(np.floor(y))
    y1 = min(y0 + 1, height - 1)
    tx = x - x0
    ty = y - y0

    v00 = float(grid[y0, x0])
    v10 = float(grid[y0, x1])
    v01 = float(grid[y1, x0])
    v11 = float(grid[y1, x1])

    return float(
        v00 * (1 - tx) * (1 - ty)
        + v10 * tx * (1 - ty)
        + v01 * (1 - tx) * ty
        + v11 * tx * ty
    )
