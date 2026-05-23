"""Synthetic demo assets for local development without GRIB downloads."""

from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone
from pathlib import Path

import numpy as np

from app.config import settings
from app.process.temperature import write_temperature_assets
from app.process.terrain_contours import write_terrain_contours_geojson
from app.process.uv_grid import write_uv_assets

GRID_W, GRID_H = 360, 180


def _time_dir(valid_time: str) -> Path:
    safe = valid_time.replace(":", "-")
    d = settings.processed_dir / safe
    d.mkdir(parents=True, exist_ok=True)
    return d


def _demo_temperature(valid_time: str) -> None:
    lons = np.linspace(-180, 180, GRID_W, endpoint=False)
    lats = np.linspace(90, -90, GRID_H)
    lon2d, lat2d = np.meshgrid(lons, lats)

    # Climatology-like field: warm tropics, cold poles, mild zonal variation.
    t_c = (
        28.0
        - 0.55 * np.abs(lat2d)
        - 8.0 * (np.abs(lat2d) / 90.0) ** 2
        + 3.0 * np.sin(np.radians(lon2d * 2.3)) * np.cos(np.radians(lat2d * 3))
    )
    # Slight diurnal/forecast offset from valid_time hour
    try:
        vt = datetime.fromisoformat(valid_time.replace("Z", "+00:00"))
        t_c += 2.0 * np.sin(np.radians(vt.hour * 15))
    except ValueError:
        pass

    t2m_k = t_c + 273.15
    write_temperature_assets(
        valid_time,
        t2m_k,
        bounds=[-180, -90, 180, 90],
        lats=lats,
    )


def _demo_terrain_contours(valid_time: str) -> None:
    write_terrain_contours_geojson(valid_time)


def _demo_uv(valid_time: str, prefix: str, scale: float) -> None:
    lons = np.linspace(-180, 180, GRID_W, endpoint=False)
    lats = np.linspace(90, -90, GRID_H)
    lon2d, lat2d = np.meshgrid(lons, lats)
    u = scale * np.sin(np.radians(lon2d)) * np.cos(np.radians(lat2d))
    v = scale * np.cos(np.radians(lon2d * 0.7))
    write_uv_assets(valid_time, prefix, lons, lats, u, v)


def _write_manifest(valid_time: str) -> None:
    tdir = _time_dir(valid_time)
    manifest = {
        "valid_time": valid_time,
        "source": "demo",
        "layers": ["temperature", "terrain_contours", "wind", "ocean"],
    }
    (tdir / "manifest.json").write_text(
        json.dumps(manifest, indent=2),
        encoding="utf-8",
    )


def generate_demo_times() -> list[str]:
    base = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
    times = [
        (base + timedelta(hours=h)).strftime("%Y-%m-%dT%H:%M:%SZ")
        for h in (0, 6)
    ]
    for vt in times:
        _demo_temperature(vt)
        _demo_terrain_contours(vt)
        _demo_uv(vt, "wind", 8.0)
        _demo_uv(vt, "ocean", 0.4)
        _write_manifest(vt)
    return times
