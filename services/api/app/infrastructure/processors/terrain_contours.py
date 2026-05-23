"""Global elevation contours for terrain visualization (地势等高线)."""

from __future__ import annotations

import json
from typing import Any

import matplotlib.pyplot as plt
import numpy as np

from app.config import settings

# Major peaks / ranges for demo synthetic DEM (lon, lat, height_m, sigma_deg)
MOUNTAIN_PEAKS: list[tuple[float, float, float, float]] = [
    (86.9, 28.0, 8800, 5.0),   # Himalayas / Tibet
    (138.0, 36.0, 3700, 6.0),  # Japan Alps
    (-70.0, -32.0, 6960, 5.0), # Andes
    (-105.0, 39.0, 4400, 8.0), # Rockies
    (7.0, 46.0, 4800, 5.0),    # Alps
    (37.0, 3.0, 5895, 4.0),    # Kilimanjaro
    (151.0, -33.5, 2200, 5.0), # Great Dividing Range
    (-152.0, 63.0, 6194, 6.0), # Alaska Range
    (28.0, -3.0, 5109, 4.0),   # East African Rift highlands
]

GRID_W, GRID_H = 360, 180
CONTOUR_INTERVAL_M = 500.0


def _split_segment_at_antimeridian(coords: list[list[float]]) -> list[list[list[float]]]:
    """Split a LineString when longitude jumps across the antimeridian."""
    if len(coords) < 2:
        return [coords] if len(coords) >= 2 else []

    segments: list[list[list[float]]] = []
    current: list[list[float]] = [coords[0]]

    for i in range(1, len(coords)):
        lon0 = current[-1][0]
        lon1, lat1 = coords[i]
        if abs(lon1 - lon0) > 180:
            if len(current) >= 2:
                segments.append(current)
            current = [[lon1, lat1]]
        else:
            current.append([lon1, lat1])

    if len(current) >= 2:
        segments.append(current)
    return segments


def synthetic_elevation_grid(
    lons: np.ndarray | None = None,
    lats: np.ndarray | None = None,
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Coarse global elevation field (meters) for demo without external DEM download."""
    if lons is None:
        lons = np.linspace(-180, 180, GRID_W, endpoint=False)
    if lats is None:
        lats = np.linspace(90, -90, GRID_H)

    lon2d, lat2d = np.meshgrid(lons, lats)

    # Continental plateau baseline
    elev = 300.0 * (
        0.5
        + 0.35 * np.sin(np.radians(lon2d * 0.45))
        * np.cos(np.radians(lat2d * 0.6))
    )

    # Deep ocean basins
    ocean_mask = np.sin(np.radians(lon2d * 1.2 + lat2d * 0.3)) < -0.25
    elev = np.where(ocean_mask, -3500.0 + 500.0 * np.sin(np.radians(lon2d)), elev)

    # Gaussian mountain peaks
    for lon, lat, height, sigma in MOUNTAIN_PEAKS:
        dist2 = (lon2d - lon) ** 2 + (lat2d - lat) ** 2
        elev += height * np.exp(-dist2 / (2.0 * sigma**2))

    return lons, lats, elev.astype(np.float64)


def elevation_contours_to_geojson(
    lons: np.ndarray,
    lats: np.ndarray,
    elevation_m: np.ndarray,
    levels: list[float] | None = None,
) -> dict[str, Any]:
    """Extract elevation contour lines as GeoJSON FeatureCollection."""
    if levels is None:
        zmin = float(np.nanmin(elevation_m))
        zmax = float(np.nanmax(elevation_m))
        lo = int(np.floor(zmin / CONTOUR_INTERVAL_M) * CONTOUR_INTERVAL_M)
        hi = int(np.ceil(zmax / CONTOUR_INTERVAL_M) * CONTOUR_INTERVAL_M)
        levels = list(
            np.arange(lo, hi + CONTOUR_INTERVAL_M, CONTOUR_INTERVAL_M, dtype=float)
        )
        levels = [lv for lv in levels if lv != 0.0]  # skip sea-level clutter

    lon2d, lat2d = np.meshgrid(lons, lats)
    fig, ax = plt.subplots()
    cs = ax.contour(lon2d, lat2d, elevation_m, levels=levels)
    plt.close(fig)

    features: list[dict[str, Any]] = []
    for level_idx, level in enumerate(cs.levels):
        for seg in cs.allsegs[level_idx]:
            if len(seg) < 2:
                continue
            coords = [[float(x), float(y)] for x, y in seg]
            for part in _split_segment_at_antimeridian(coords):
                features.append(
                    {
                        "type": "Feature",
                        "properties": {"elevation_m": float(level)},
                        "geometry": {"type": "LineString", "coordinates": part},
                    }
                )

    return {"type": "FeatureCollection", "features": features}


def build_terrain_contours_geojson() -> dict[str, Any]:
    """Build terrain contours from synthetic global elevation."""
    lons, lats, elev = synthetic_elevation_grid()
    return elevation_contours_to_geojson(lons, lats, elev)


def write_terrain_contours_geojson(valid_time: str, geojson: dict | None = None) -> None:
    safe = valid_time.replace(":", "-")
    tdir = settings.processed_dir / safe
    tdir.mkdir(parents=True, exist_ok=True)
    payload = geojson if geojson is not None else build_terrain_contours_geojson()
    path = tdir / "terrain_contours.geojson"
    path.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
