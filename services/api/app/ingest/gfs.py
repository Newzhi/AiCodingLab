from __future__ import annotations

import logging
from datetime import datetime, timezone

import numpy as np

from app.config import settings
from app.process.demo import generate_demo_times
from app.process.terrain_contours import write_terrain_contours_geojson
from app.process.temperature import write_temperature_assets
from app.process.uv_grid import write_uv_assets

logger = logging.getLogger(__name__)


def _write_manifest(valid_time: str, source: str = "gfs") -> None:
    import json
    from pathlib import Path

    safe = valid_time.replace(":", "-")
    tdir = settings.processed_dir / safe
    tdir.mkdir(parents=True, exist_ok=True)
    manifest = {
        "valid_time": valid_time,
        "source": source,
        "layers": ["temperature", "terrain_contours", "wind"],
    }
    (tdir / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")


def ingest_gfs() -> dict:
    """Download and process GFS fields via Herbie. Falls back to demo on failure."""
    try:
        from herbie import Herbie
    except ImportError:
        logger.warning("Herbie not available; generating demo data")
        times = generate_demo_times()
        return {"status": "demo", "valid_times": times}

    processed: list[str] = []
    try:
        H = Herbie(
            datetime.now(timezone.utc).strftime("%Y-%m-%d %H:00"),
            model=settings.gfs_model,
            product=settings.gfs_product,
        )
        for fxx in settings.forecast_hours:
            ds_t = H.xarray("TMP:2 m", fxx=fxx)
            ds_u = H.xarray("UGRD:10 m", fxx=fxx)
            ds_v = H.xarray("VGRD:10 m", fxx=fxx)

            valid = getattr(ds_t, "valid_time", None)
            if valid is not None:
                vt = np.datetime_as_string(valid.values, unit="s") + "Z"
            else:
                vt = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

            t2m = np.asarray(ds_t[list(ds_t.data_vars)[0]].values, dtype=float)
            u10 = np.asarray(ds_u[list(ds_u.data_vars)[0]].values, dtype=float)
            v10 = np.asarray(ds_v[list(ds_v.data_vars)[0]].values, dtype=float)

            lats = np.asarray(ds_t.latitude.values)
            lons = np.asarray(ds_t.longitude.values)
            if lons.max() > 180:
                lons = ((lons + 180) % 360) - 180

            write_temperature_assets(
                vt,
                t2m,
                bounds=[
                    float(lons.min()),
                    float(lats.min()),
                    float(lons.max()),
                    float(lats.max()),
                ],
                lats=lats,
            )
            write_terrain_contours_geojson(vt)
            write_uv_assets(vt, "wind", lons, lats, u10, v10)
            _write_manifest(vt, "gfs")
            processed.append(vt)
    except Exception as exc:
        logger.exception("GFS ingest failed: %s", exc)
        times = generate_demo_times()
        return {"status": "fallback_demo", "error": str(exc), "valid_times": times}

    return {"status": "ok", "valid_times": processed}
