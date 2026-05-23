"""Chain Open-Meteo → wttr.in with shared file cache."""

from __future__ import annotations

from app.domain.entities import PointWeatherResult
from app.infrastructure.providers.open_meteo_provider import (
    OpenMeteoProvider,
    default_open_meteo_provider,
)
from app.infrastructure.providers.point_cache import PointWeatherCache, default_point_cache
from app.infrastructure.providers.wttr_provider import WttrProvider, default_wttr_provider


class WebPointProviderChain:
    """Implements PointTemperatureProvider — Open-Meteo first, wttr.in scrape fallback."""

    def __init__(
        self,
        open_meteo: OpenMeteoProvider | None = None,
        wttr: WttrProvider | None = None,
        cache: PointWeatherCache | None = None,
    ) -> None:
        self._open_meteo = open_meteo or default_open_meteo_provider
        self._wttr = wttr or default_wttr_provider
        self._cache = cache or default_point_cache

    def query(self, lat: float, lon: float, *, allow_scrape: bool = True) -> PointWeatherResult | None:
        cached = self._cache.get(lat, lon)
        if cached is not None and cached.get("temp_c") is not None:
            return PointWeatherResult.from_dict(cached)

        result = self._open_meteo.query(lat, lon)
        if result is None and allow_scrape:
            result = self._wttr.query(lat, lon)

        if result is not None:
            self._cache.set(lat, lon, result.to_dict())
        return result


default_web_point_chain = WebPointProviderChain()
