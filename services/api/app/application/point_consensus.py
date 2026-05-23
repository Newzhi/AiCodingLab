from __future__ import annotations

import statistics
from typing import Literal

from app.domain.entities import PointWeatherSourceReading

Confidence = Literal["high", "medium", "low"]

PRIMARY_ORDER = ("grid", "open-meteo", "openweather", "web-scrape")


def valid_temps(sources: list[PointWeatherSourceReading]) -> list[float]:
    return [s.temp_c for s in sources if s.status == "ok" and s.temp_c is not None]


def compute_consensus(temps: list[float]) -> tuple[float | None, Confidence]:
    if not temps:
        return None, "low"
    consensus = float(statistics.median(temps))
    if len(temps) == 1:
        return consensus, "medium"
    spread = max(temps) - min(temps)
    if spread > 3.0:
        return consensus, "low"
    if spread > 1.5:
        return consensus, "medium"
    return consensus, "high"


def pick_primary(sources: list[PointWeatherSourceReading]) -> str:
    ok_ids = {s.id for s in sources if s.status == "ok" and s.temp_c is not None}
    for source_id in PRIMARY_ORDER:
        if source_id in ok_ids:
            return source_id
    return "none"
