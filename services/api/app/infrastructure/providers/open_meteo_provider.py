"""Open-Meteo forecast API — primary real-time point temperature source."""

from __future__ import annotations

import logging
import time
from threading import Lock

import httpx

from app.domain.entities import PointWeatherResult

logger = logging.getLogger(__name__)

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"


class OpenMeteoProvider:
    """Rate-limited Open-Meteo client (no API key required)."""

    def __init__(self, min_interval_sec: float = 1.0) -> None:
        self._min_interval = min_interval_sec
        self._last_call = 0.0
        self._lock = Lock()

    @property
    def source_name(self) -> str:
        return "open-meteo"

    def query(self, lat: float, lon: float) -> PointWeatherResult | None:
        with self._lock:
            elapsed = time.monotonic() - self._last_call
            if elapsed < self._min_interval:
                time.sleep(self._min_interval - elapsed)
            self._last_call = time.monotonic()

        params = {
            "latitude": lat,
            "longitude": lon,
            "current": "temperature_2m",
            "timezone": "UTC",
        }
        try:
            with httpx.Client(timeout=8.0, headers={"User-Agent": "EarthWeather/0.1"}) as client:
                resp = client.get(OPEN_METEO_URL, params=params)
                resp.raise_for_status()
                data = resp.json()
                current = data.get("current") or {}
                temp = current.get("temperature_2m")
                if temp is None:
                    return None
                fetched_at = current.get("time")
                return PointWeatherResult(
                    lat=lat,
                    lon=lon,
                    temp_c=float(temp),
                    source=self.source_name,
                    fetched_at=fetched_at,
                )
        except Exception as exc:
            logger.warning("Open-Meteo query failed: %s", exc)
            return None


default_open_meteo_provider = OpenMeteoProvider()
