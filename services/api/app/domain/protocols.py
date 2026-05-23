"""Domain protocols — dependency inversion for data sources and storage."""

from __future__ import annotations

from pathlib import Path
from typing import Any, Protocol, runtime_checkable

import numpy as np


@runtime_checkable
class GridRepository(Protocol):
    """Read/write processed grid assets on disk."""

    def time_dir(self, valid_time: str) -> Path: ...

    def list_valid_times(self) -> list[str]: ...

    def read_manifest(self, valid_time: str) -> dict[str, Any] | None: ...

    def write_manifest(self, valid_time: str, source: str, layers: list[str]) -> None: ...

    def layer_file_exists(self, valid_time: str, layer_id: str, file_key: str) -> bool: ...

    def resolve_layer_assets(self, valid_time: str, layer_id: str) -> dict[str, str]: ...


@runtime_checkable
class WeatherDataSource(Protocol):
    """Fetch or synthesize meteorological fields for a valid time."""

    def source_name(self) -> str: ...

    def fetch_temperature(
        self, valid_time: str
    ) -> tuple[np.ndarray, np.ndarray, np.ndarray, list[float]]: ...

    def fetch_wind(
        self, valid_time: str
    ) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]: ...

    def fetch_ocean(
        self, valid_time: str
    ) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]: ...


@runtime_checkable
class ContourGenerator(Protocol):
    """Generate terrain elevation contours."""

    def build_geojson(self) -> dict[str, Any]: ...

    def write_for_time(self, valid_time: str, geojson: dict[str, Any] | None = None) -> None: ...


@runtime_checkable
class PointTemperatureProvider(Protocol):
    """Optional enrichment from external point APIs."""

    def query(self, lat: float, lon: float) -> float | None: ...
