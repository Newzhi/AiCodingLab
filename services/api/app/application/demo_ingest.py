from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone

from app.domain.entities import LayerId
from app.infrastructure.demo_generators import (
    synthetic_temperature_c,
    synthetic_uv,
)
from app.infrastructure.file_storage import FileGridRepository, default_grid_repository
from app.infrastructure.processors.region_temperature import write_region_temperatures
from app.infrastructure.processors.temperature import write_temperature_assets
from app.infrastructure.processors.terrain_contours import write_terrain_contours_geojson
from app.infrastructure.processors.uv_grid import write_uv_assets

logger = logging.getLogger(__name__)

ALL_LAYERS = [
    LayerId.TEMPERATURE,
    LayerId.TERRAIN_CONTOURS,
    LayerId.WIND,
    LayerId.OCEAN,
]


class DemoIngestService:
    def __init__(self, repo: FileGridRepository | None = None) -> None:
        self._repo = repo or default_grid_repository

    def regenerate_temperature_for_time(self, valid_time: str) -> None:
        lons, lats, t_c = synthetic_temperature_c(valid_time)
        write_temperature_assets(
            valid_time,
            t_c + 273.15,
            bounds=[-180, -90, 180, 90],
            lats=lats,
        )
        write_region_temperatures(valid_time, source="demo")

    def generate_for_time(self, valid_time: str) -> None:
        lons, lats, t_c = synthetic_temperature_c(valid_time)
        write_temperature_assets(
            valid_time,
            t_c + 273.15,
            bounds=[-180, -90, 180, 90],
            lats=lats,
        )
        write_region_temperatures(valid_time, source="demo")
        write_terrain_contours_geojson(valid_time)
        _, _, u, v = synthetic_uv(8.0)
        write_uv_assets(valid_time, "wind", lons, lats, u, v)
        _, _, uo, vo = synthetic_uv(0.4)
        write_uv_assets(valid_time, "ocean", lons, lats, uo, vo)
        write_region_temperatures(valid_time, source="demo")
        self._repo.write_manifest(valid_time, "demo", [lid.value for lid in ALL_LAYERS])

    def generate_demo_times(self) -> list[str]:
        base = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
        times = [
            (base + timedelta(hours=h)).strftime("%Y-%m-%dT%H:%M:%SZ")
            for h in (0, 6)
        ]
        for vt in times:
            self.generate_for_time(vt)
        return times

    def repair_existing_times(self) -> None:
        """Ensure terrain_contours and temperature grid exist for all stored times."""
        for vt in self._repo.list_valid_times():
            self._repo.ensure_terrain_contours(vt)
            if not self._repo.layer_file_exists(vt, LayerId.TEMPERATURE, "grid"):
                try:
                    self.regenerate_temperature_for_time(vt)
                except Exception as exc:
                    logger.warning("Could not repair temperature grid for %s: %s", vt, exc)


def generate_demo_times() -> list[str]:
    return DemoIngestService().generate_demo_times()
