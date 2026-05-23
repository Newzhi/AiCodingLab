"""OpenWeatherMap One Call 3.0 — optional API key (OPENWEATHER_API_KEY)."""

from __future__ import annotations

import logging
import time
from datetime import UTC, datetime
from threading import Lock

import httpx

from app.config import settings
from app.domain.entities import PointWeatherResult

logger = logging.getLogger(__name__)

OPENWEATHER_URL = "https://api.openweathermap.org/data/2.5/weather"


class OpenWeatherProvider:
    """Current weather; skipped when OPENWEATHER_API_KEY is unset."""

    def __init__(self, api_key: str | None = None, min_interval_sec: float = 1.0) -> None:
        self._api_key = (api_key if api_key is not None else settings.openweather_api_key).strip()
        self._min_interval = min_interval_sec
        self._last_call = 0.0
        self._lock = Lock()

    @property
    def enabled(self) -> bool:
        return bool(self._api_key)

    @property
    def source_name(self) -> str:
        return "openweather"

    def query(self, lat: float, lon: float) -> PointWeatherResult | None:
        if not self.enabled:
            return None

        with self._lock:
            elapsed = time.monotonic() - self._last_call
            if elapsed < self._min_interval:
                time.sleep(self._min_interval - elapsed)
            self._last_call = time.monotonic()

        params = {
            "lat": lat,
            "lon": lon,
            "appid": self._api_key,
            "units": "metric",
        }
        try:
            with httpx.Client(timeout=8.0, headers={"User-Agent": "EarthWeather/0.1"}) as client:
                resp = client.get(OPENWEATHER_URL, params=params)
                resp.raise_for_status()
                data = resp.json()
                main = data.get("main") or {}
                temp = main.get("temp")
                if temp is None:
                    return None
                return PointWeatherResult(
                    lat=lat,
                    lon=lon,
                    temp_c=float(temp),
                    source=self.source_name,
                    fetched_at=datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ"),
                )
        except Exception as exc:
            logger.warning("OpenWeatherMap query failed: %s", exc)
            return None


default_openweather_provider = OpenWeatherProvider()
