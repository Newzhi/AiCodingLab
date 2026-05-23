"""Synthetic field generators for demo ingest."""

from __future__ import annotations

from datetime import datetime

import numpy as np

GRID_W, GRID_H = 360, 180


def demo_lons_lats() -> tuple[np.ndarray, np.ndarray]:
    lons = np.linspace(-180, 180, GRID_W, endpoint=False)
    lats = np.linspace(90, -90, GRID_H)
    return lons, lats


def synthetic_temperature_c(valid_time: str) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    lons, lats = demo_lons_lats()
    lon2d, lat2d = np.meshgrid(lons, lats)
    t_c = (
        28.0
        - 0.55 * np.abs(lat2d)
        - 8.0 * (np.abs(lat2d) / 90.0) ** 2
        + 3.0 * np.sin(np.radians(lon2d * 2.3)) * np.cos(np.radians(lat2d * 3))
    )
    try:
        vt = datetime.fromisoformat(valid_time.replace("Z", "+00:00"))
        t_c += 2.0 * np.sin(np.radians(vt.hour * 15))
    except ValueError:
        pass
    return lons, lats, t_c.astype(np.float64)


def synthetic_uv(
    scale: float,
) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    lons, lats = demo_lons_lats()
    lon2d, lat2d = np.meshgrid(lons, lats)
    u = scale * np.sin(np.radians(lon2d)) * np.cos(np.radians(lat2d))
    v = scale * np.cos(np.radians(lon2d * 0.7))
    return lons, lats, u, v
