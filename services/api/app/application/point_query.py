from __future__ import annotations

from datetime import UTC, datetime

from app.domain.entities import PointWeatherResult
from app.infrastructure.file_storage import default_grid_repository
from app.infrastructure.processors.temperature import (
    read_temperature_grid,
    sample_temperature_bilinear,
)
from app.infrastructure.providers.open_meteo_provider import (
    OpenMeteoProvider,
    default_open_meteo_provider,
)


def _normalize_grid_source(manifest_source: str | None) -> str:
    if manifest_source in ("demo", "gfs", "synthetic"):
        return manifest_source or "demo"
    return manifest_source or "grid"


class PointQueryService:
    def __init__(
        self,
        open_meteo: OpenMeteoProvider | None = None,
    ) -> None:
        self._repo = default_grid_repository
        self._open_meteo = open_meteo or default_open_meteo_provider

    def query_temperature(
        self,
        lat: float,
        lon: float,
        valid_time: str | None = None,
        allow_open_meteo: bool = True,
    ) -> PointWeatherResult:
        lat = max(-90.0, min(90.0, lat))
        lon = ((lon + 180) % 360) - 180

        if valid_time:
            loaded = read_temperature_grid(valid_time)
            if loaded is not None:
                grid, meta = loaded
                temp = sample_temperature_bilinear(grid, meta, lat, lon)
                if temp is not None:
                    manifest = self._repo.read_manifest(valid_time)
                    source = _normalize_grid_source((manifest or {}).get("source"))
                    return PointWeatherResult(
                        lat=lat,
                        lon=lon,
                        temp_c=temp,
                        source=source,
                        fetched_at=valid_time,
                    )

        if allow_open_meteo:
            om = self._open_meteo.query(lat, lon)
            if om is not None:
                return om

        return PointWeatherResult(
            lat=lat,
            lon=lon,
            temp_c=None,
            source="none",
            fetched_at=datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ"),
        )

    def query_point(
        self,
        lat: float,
        lon: float,
        valid_time: str | None = None,
        *,
        prefer_web: bool = False,
        allow_web: bool = True,
        allow_scrape: bool = False,
    ) -> PointWeatherResult:
        """Compatibility wrapper — scraping disabled per AGENTS.md."""
        if prefer_web:
            return self.query_temperature(lat, lon, None, allow_open_meteo=allow_web)
        return self.query_temperature(lat, lon, valid_time, allow_open_meteo=allow_web)
