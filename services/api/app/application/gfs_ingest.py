from __future__ import annotations

import logging
from datetime import datetime, timezone

import numpy as np

from app.application.demo_ingest import DemoIngestService
from app.config import settings
from app.domain.entities import LayerId
from app.infrastructure.file_storage import default_grid_repository
from app.infrastructure.processors.region_temperature import write_region_temperatures
from app.infrastructure.processors.temperature import write_temperature_assets
from app.infrastructure.processors.terrain_contours import write_terrain_contours_geojson
from app.infrastructure.processors.uv_grid import write_uv_assets

logger = logging.getLogger(__name__)


class GfsIngestService:
    def __init__(self) -> None:
        self._repo = default_grid_repository
        self._demo = DemoIngestService(self._repo)

    def ingest(self) -> dict:
        try:
            from herbie import Herbie
        except ImportError:
            logger.warning("Herbie not available; generating demo data")
            times = self._demo.generate_demo_times()
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
                write_region_temperatures(vt, source="gfs")
                write_uv_assets(vt, "wind", lons, lats, u10, v10)
                self._repo.write_manifest(
                    vt,
                    "gfs",
                    [LayerId.TEMPERATURE, LayerId.TERRAIN_CONTOURS, LayerId.WIND],
                )
                processed.append(vt)
        except Exception as exc:
            logger.exception("GFS ingest failed: %s", exc)
            times = self._demo.generate_demo_times()
            return {"status": "fallback_demo", "error": str(exc), "valid_times": times}

        return {"status": "ok", "valid_times": processed}


def ingest_gfs() -> dict:
    return GfsIngestService().ingest()
