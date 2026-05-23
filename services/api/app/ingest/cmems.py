from __future__ import annotations

import logging
from datetime import datetime, timezone

import numpy as np

from app.config import settings
from app.process.uv_grid import write_uv_assets
from app.services.catalog import list_valid_times

logger = logging.getLogger(__name__)


def ingest_cmems_for_time(valid_time: str | None = None) -> dict:
    """Subset CMEMS uo/vo. Requires credentials; uses synthetic ocean if unavailable."""
    if not valid_time:
        times = list_valid_times()
        if not times:
            from app.process.demo import generate_demo_times

            times = generate_demo_times()
        valid_time = times[-1]

    if not settings.cmems_username or not settings.cmems_password:
        logger.info("CMEMS credentials missing; writing synthetic ocean UV")
        return _synthetic_ocean(valid_time)

    try:
        import copernicusmarine

        ds = copernicusmarine.open_dataset(
            dataset_id=settings.cmems_dataset_id,
            variables=["uo", "vo"],
            minimum_longitude=-180,
            maximum_longitude=180,
            minimum_latitude=-80,
            maximum_latitude=80,
            start_datetime=valid_time,
            end_datetime=valid_time,
            username=settings.cmems_username,
            password=settings.cmems_password,
        )
        uo = np.asarray(ds["uo"].isel(time=0, depth=0).values, dtype=float)
        vo = np.asarray(ds["vo"].isel(time=0, depth=0).values, dtype=float)
        lats = np.asarray(ds.latitude.values)
        lons = np.asarray(ds.longitude.values)
        write_uv_assets(valid_time, "ocean", lons, lats, uo, vo)
        return {"status": "ok", "valid_time": valid_time, "source": "cmems"}
    except Exception as exc:
        logger.exception("CMEMS ingest failed: %s", exc)
        return _synthetic_ocean(valid_time, error=str(exc))


def _synthetic_ocean(valid_time: str, error: str | None = None) -> dict:
    w, h = 180, 90
    lons = np.linspace(-180, 180, w, endpoint=False)
    lats = np.linspace(-80, 80, h)
    lon2d, lat2d = np.meshgrid(lons, lats)
    u = 0.3 * np.sin(np.radians(lon2d * 2))
    v = 0.2 * np.cos(np.radians(lat2d))
    write_uv_assets(valid_time, "ocean", lons, lats, u, v)
    out = {"status": "synthetic", "valid_time": valid_time}
    if error:
        out["error"] = error
    return out
