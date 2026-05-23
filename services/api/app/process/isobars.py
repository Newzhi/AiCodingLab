from __future__ import annotations

import json
from typing import Any

import matplotlib.pyplot as plt
import numpy as np


def contours_to_geojson(
    lons: np.ndarray,
    lats: np.ndarray,
    msl_hpa: np.ndarray,
    levels: list[float] | None = None,
) -> dict[str, Any]:
    if levels is None:
        lo = int(np.nanmin(msl_hpa) // 4 * 4)
        hi = int(np.nanmax(msl_hpa) // 4 * 4 + 4)
        levels = list(range(lo, hi + 1, 4))

    lon2d, lat2d = np.meshgrid(lons, lats)
    fig, ax = plt.subplots()
    cs = ax.contour(lon2d, lat2d, msl_hpa, levels=levels)
    plt.close(fig)

    features: list[dict[str, Any]] = []
    for level_idx, level in enumerate(cs.levels):
        for seg in cs.allsegs[level_idx]:
            if len(seg) < 2:
                continue
            coords = [[float(x), float(y)] for x, y in seg]
            features.append(
                {
                    "type": "Feature",
                    "properties": {"pressure_hPa": float(level)},
                    "geometry": {"type": "LineString", "coordinates": coords},
                }
            )

    return {"type": "FeatureCollection", "features": features}


def write_isobars_geojson(valid_time: str, geojson: dict) -> None:
    from app.config import settings

    safe = valid_time.replace(":", "-")
    tdir = settings.processed_dir / safe
    tdir.mkdir(parents=True, exist_ok=True)
    path = tdir / "isobars.geojson"
    path.write_text(json.dumps(geojson, ensure_ascii=False), encoding="utf-8")
