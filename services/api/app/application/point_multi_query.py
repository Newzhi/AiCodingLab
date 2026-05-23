from __future__ import annotations

import logging
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import UTC, datetime

from app.application.point_consensus import compute_consensus, pick_primary, valid_temps
from app.config import settings
from app.domain.entities import PointWeatherMultiResult, PointWeatherSourceReading
from app.infrastructure.file_storage import default_grid_repository
from app.infrastructure.processors.temperature import (
    read_temperature_grid,
    sample_temperature_bilinear,
)
from app.infrastructure.providers.multi_point_cache import (
    MultiPointWeatherCache,
    default_multi_point_cache,
)
from app.infrastructure.providers.open_meteo_provider import (
    OpenMeteoProvider,
    default_open_meteo_provider,
)
from app.infrastructure.providers.openweather_provider import (
    OpenWeatherProvider,
    default_openweather_provider,
)
from app.infrastructure.providers.wttr_provider import WttrProvider, default_wttr_provider

logger = logging.getLogger(__name__)


def _round_coords(lat: float, lon: float) -> tuple[float, float]:
    lat = max(-90.0, min(90.0, round(lat, 2)))
    lon = ((round(lon, 2) + 180) % 360) - 180
    return lat, lon


class PointMultiQueryService:
    """Fetch all configured providers; median consensus with confidence flag."""

    def __init__(
        self,
        open_meteo: OpenMeteoProvider | None = None,
        wttr: WttrProvider | None = None,
        openweather: OpenWeatherProvider | None = None,
        cache: MultiPointWeatherCache | None = None,
    ) -> None:
        self._open_meteo = open_meteo or default_open_meteo_provider
        self._wttr = wttr or default_wttr_provider
        self._openweather = openweather or default_openweather_provider
        self._cache = cache or default_multi_point_cache
        self._repo = default_grid_repository

    def _fetch_grid(
        self, lat: float, lon: float, valid_time: str | None
    ) -> PointWeatherSourceReading:
        t0 = time.perf_counter()
        if not valid_time:
            return PointWeatherSourceReading(
                id="grid",
                temp_c=None,
                status="skipped",
                latency_ms=int((time.perf_counter() - t0) * 1000),
                error="no valid_time",
            )
        try:
            loaded = read_temperature_grid(valid_time)
            if loaded is None:
                return PointWeatherSourceReading(
                    id="grid",
                    temp_c=None,
                    status="error",
                    latency_ms=int((time.perf_counter() - t0) * 1000),
                    error="grid not available",
                )
            grid, meta = loaded
            temp = sample_temperature_bilinear(grid, meta, lat, lon)
            if temp is None:
                return PointWeatherSourceReading(
                    id="grid",
                    temp_c=None,
                    status="error",
                    latency_ms=int((time.perf_counter() - t0) * 1000),
                    error="out of grid bounds",
                )
            return PointWeatherSourceReading(
                id="grid",
                temp_c=temp,
                status="ok",
                latency_ms=int((time.perf_counter() - t0) * 1000),
            )
        except Exception as exc:
            logger.debug("grid multi fetch failed: %s", exc)
            return PointWeatherSourceReading(
                id="grid",
                temp_c=None,
                status="error",
                latency_ms=int((time.perf_counter() - t0) * 1000),
                error=str(exc),
            )

    def _fetch_open_meteo(self, lat: float, lon: float) -> PointWeatherSourceReading:
        t0 = time.perf_counter()
        try:
            result = self._open_meteo.query(lat, lon)
            ms = int((time.perf_counter() - t0) * 1000)
            if result is None or result.temp_c is None:
                return PointWeatherSourceReading(
                    id="open-meteo",
                    temp_c=None,
                    status="error",
                    latency_ms=ms,
                    error="no data",
                )
            return PointWeatherSourceReading(
                id="open-meteo",
                temp_c=result.temp_c,
                status="ok",
                latency_ms=ms,
            )
        except Exception as exc:
            return PointWeatherSourceReading(
                id="open-meteo",
                temp_c=None,
                status="error",
                latency_ms=int((time.perf_counter() - t0) * 1000),
                error=str(exc),
            )

    def _fetch_wttr(self, lat: float, lon: float, *, allow_scrape: bool) -> PointWeatherSourceReading:
        if not allow_scrape or not settings.enable_web_weather:
            return PointWeatherSourceReading(
                id="web-scrape",
                temp_c=None,
                status="skipped",
                error="disabled",
            )
        t0 = time.perf_counter()
        try:
            result = self._wttr.query(lat, lon)
            ms = int((time.perf_counter() - t0) * 1000)
            if result is None or result.temp_c is None:
                return PointWeatherSourceReading(
                    id="web-scrape",
                    temp_c=None,
                    status="error",
                    latency_ms=ms,
                    error="no data",
                )
            return PointWeatherSourceReading(
                id="web-scrape",
                temp_c=result.temp_c,
                status="ok",
                latency_ms=ms,
            )
        except Exception as exc:
            return PointWeatherSourceReading(
                id="web-scrape",
                temp_c=None,
                status="error",
                latency_ms=int((time.perf_counter() - t0) * 1000),
                error=str(exc),
            )

    def _fetch_openweather(self, lat: float, lon: float) -> PointWeatherSourceReading:
        if not self._openweather.enabled:
            return PointWeatherSourceReading(
                id="openweather",
                temp_c=None,
                status="skipped",
                error="OPENWEATHER_API_KEY not set",
            )
        t0 = time.perf_counter()
        try:
            result = self._openweather.query(lat, lon)
            ms = int((time.perf_counter() - t0) * 1000)
            if result is None or result.temp_c is None:
                return PointWeatherSourceReading(
                    id="openweather",
                    temp_c=None,
                    status="error",
                    latency_ms=ms,
                    error="no data",
                )
            return PointWeatherSourceReading(
                id="openweather",
                temp_c=result.temp_c,
                status="ok",
                latency_ms=ms,
            )
        except Exception as exc:
            return PointWeatherSourceReading(
                id="openweather",
                temp_c=None,
                status="error",
                latency_ms=int((time.perf_counter() - t0) * 1000),
                error=str(exc),
            )

    def query_multi(
        self,
        lat: float,
        lon: float,
        valid_time: str | None = None,
        *,
        allow_scrape: bool = True,
        use_cache: bool = True,
    ) -> PointWeatherMultiResult:
        lat, lon = _round_coords(lat, lon)

        if use_cache:
            cached = self._cache.get(lat, lon)
            if cached is not None:
                return cached

        timeout = settings.point_provider_timeout_sec
        tasks = {
            "grid": lambda: self._fetch_grid(lat, lon, valid_time),
            "open-meteo": lambda: self._fetch_open_meteo(lat, lon),
            "web-scrape": lambda: self._fetch_wttr(lat, lon, allow_scrape=allow_scrape),
            "openweather": lambda: self._fetch_openweather(lat, lon),
        }

        sources: list[PointWeatherSourceReading] = []
        with ThreadPoolExecutor(max_workers=len(tasks)) as pool:
            futures = {name: pool.submit(fn) for name, fn in tasks.items()}
            for name, future in futures.items():
                try:
                    sources.append(future.result(timeout=timeout))
                except Exception as exc:
                    logger.warning("provider %s failed: %s", name, exc)
                    sources.append(
                        PointWeatherSourceReading(
                            id=name,
                            temp_c=None,
                            status="error",
                            error=str(exc),
                        )
                    )

        order = ("grid", "open-meteo", "openweather", "web-scrape")
        sources.sort(key=lambda s: order.index(s.id) if s.id in order else 99)

        temps = valid_temps(sources)
        consensus, confidence = compute_consensus(temps)
        primary = pick_primary(sources)
        fetched_at = datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")

        result = PointWeatherMultiResult(
            lat=lat,
            lon=lon,
            consensus_temp_c=consensus,
            confidence=confidence,
            sources=sources,
            primary_used=primary,
            fetched_at=fetched_at,
        )
        self._cache.set(lat, lon, result)
        return result
