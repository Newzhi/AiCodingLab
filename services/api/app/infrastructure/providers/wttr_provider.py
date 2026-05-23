"""wttr.in JSON fallback — fragile third-party web source (no login)."""

from __future__ import annotations

import logging
import time
from datetime import UTC, datetime
from threading import Lock

import httpx

from app.domain.entities import PointWeatherResult

logger = logging.getLogger(__name__)


class WttrProvider:
    """wttr.in point query; may break if upstream changes format or blocks bots."""

    def __init__(self, min_interval_sec: float = 3.0) -> None:
        self._min_interval = min_interval_sec
        self._last_call = 0.0
        self._lock = Lock()

    @property
    def source_name(self) -> str:
        return "web-scrape"

    def query(self, lat: float, lon: float) -> PointWeatherResult | None:
        with self._lock:
            elapsed = time.monotonic() - self._last_call
            if elapsed < self._min_interval:
                time.sleep(self._min_interval - elapsed)
            self._last_call = time.monotonic()

        url = f"https://wttr.in/{lat:.4f},{lon:.4f}"
        params = {"format": "j1"}
        headers = {"User-Agent": "curl/8.0 (EarthWeather demo; +https://github.com/Newzhi/AiCodingLab)"}
        try:
            with httpx.Client(timeout=10.0, follow_redirects=True) as client:
                resp = client.get(url, params=params, headers=headers)
                resp.raise_for_status()
                data = resp.json()
                conditions = data.get("current_condition") or []
                if not conditions:
                    return None
                temp_raw = conditions[0].get("temp_C")
                if temp_raw is None:
                    return None
                return PointWeatherResult(
                    lat=lat,
                    lon=lon,
                    temp_c=float(temp_raw),
                    source=self.source_name,
                    fetched_at=datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ"),
                )
        except Exception as exc:
            logger.warning("wttr.in query failed: %s", exc)
            return None


default_wttr_provider = WttrProvider()
