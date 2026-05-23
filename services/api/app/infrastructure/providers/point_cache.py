"""File cache for point weather queries (TTL 10–30 min)."""

from __future__ import annotations

import json
import logging
from datetime import UTC, datetime
from pathlib import Path

from app.config import settings

logger = logging.getLogger(__name__)


class PointWeatherCache:
    def __init__(self, cache_dir: Path | None = None, ttl_sec: int | None = None) -> None:
        self._dir = cache_dir or settings.point_weather_cache_dir
        self._ttl = ttl_sec if ttl_sec is not None else settings.point_weather_cache_ttl_sec
        self._dir.mkdir(parents=True, exist_ok=True)

    @staticmethod
    def _key(lat: float, lon: float) -> str:
        return f"{lat:.2f}_{lon:.2f}"

    def _path(self, lat: float, lon: float) -> Path:
        return self._dir / f"{self._key(lat, lon)}.json"

    def get(self, lat: float, lon: float) -> dict | None:
        path = self._path(lat, lon)
        if not path.exists():
            return None
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            fetched_at = datetime.fromisoformat(data["fetched_at"].replace("Z", "+00:00"))
            age = (datetime.now(UTC) - fetched_at.astimezone(UTC)).total_seconds()
            if age > self._ttl:
                path.unlink(missing_ok=True)
                return None
            return data
        except Exception as exc:
            logger.debug("Point cache read failed %s: %s", path, exc)
            path.unlink(missing_ok=True)
            return None

    def set(self, lat: float, lon: float, payload: dict) -> None:
        path = self._path(lat, lon)
        try:
            path.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
        except Exception as exc:
            logger.warning("Point cache write failed %s: %s", path, exc)


default_point_cache = PointWeatherCache()
