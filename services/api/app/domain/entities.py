"""Domain entities — layer IDs, manifests, query results."""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import StrEnum
from typing import Any


class LayerId(StrEnum):
    TEMPERATURE = "temperature"
    TERRAIN_CONTOURS = "terrain_contours"
    WIND = "wind"
    OCEAN = "ocean"


DATA_LAYER_IDS = frozenset(
    {LayerId.TEMPERATURE, LayerId.TERRAIN_CONTOURS, LayerId.WIND, LayerId.OCEAN}
)

LAYER_FILES: dict[str, dict[str, str]] = {
    LayerId.TEMPERATURE: {
        "texture": "temperature.png",
        "meta": "temperature.meta.json",
        "grid": "temperature.grid.bin",
    },
    LayerId.TERRAIN_CONTOURS: {
        "geojson": "terrain_contours.geojson",
    },
    LayerId.WIND: {
        "meta": "wind.uv.json",
        "binary": "wind.uv.bin",
    },
    LayerId.OCEAN: {
        "meta": "ocean.uv.json",
        "binary": "ocean.uv.bin",
    },
}

DEPRECATED_LAYERS: dict[str, str] = {
    "isobars": "pressure isobars removed; use terrain_contours",
}


@dataclass(frozen=True)
class TimeManifest:
    valid_time: str
    source: str
    layers: list[str] = field(default_factory=list)

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> TimeManifest:
        return cls(
            valid_time=data["valid_time"],
            source=data.get("source", "unknown"),
            layers=list(data.get("layers", [])),
        )

    def to_dict(self) -> dict[str, Any]:
        return {
            "valid_time": self.valid_time,
            "source": self.source,
            "layers": self.layers,
        }


@dataclass(frozen=True)
class PointWeatherResult:
    lat: float
    lon: float
    temp_c: float | None
    source: str
    fetched_at: str | None = None

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> PointWeatherResult:
        return cls(
            lat=float(data["lat"]),
            lon=float(data["lon"]),
            temp_c=data.get("temp_c"),
            source=str(data.get("source", "none")),
            fetched_at=data.get("fetched_at"),
        )

    def to_dict(self) -> dict[str, Any]:
        return {
            "lat": self.lat,
            "lon": self.lon,
            "temp_c": self.temp_c,
            "source": self.source,
            "fetched_at": self.fetched_at,
        }


# Backward-compatible alias
PointTemperature = PointWeatherResult
