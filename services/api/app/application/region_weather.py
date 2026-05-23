from __future__ import annotations

from dataclasses import dataclass

from app.application.demo_ingest import DemoIngestService
from app.infrastructure.processors.region_temperature import (
    get_region_index,
    read_region_temperatures,
    write_region_temperatures,
)


@dataclass(frozen=True)
class RegionWeatherResult:
    region_id: str
    name: str
    name_zh: str
    admin_level: str
    temp_c: float | None
    temp_max_c: float | None
    source: str
    confidence: str
    bounds: list[float]
    valid_time: str | None
    cell_count: int | None = None

    def to_dict(self) -> dict:
        return {
            "region_id": self.region_id,
            "name": self.name,
            "name_zh": self.name_zh,
            "admin_level": self.admin_level,
            "temp_c": self.temp_c,
            "temp_max_c": self.temp_max_c,
            "source": self.source,
            "confidence": self.confidence,
            "bounds": self.bounds,
            "valid_time": self.valid_time,
            "cell_count": self.cell_count,
        }


class RegionWeatherService:
    def ensure_region_temps(self, valid_time: str, source: str = "grid") -> dict | None:
        data = read_region_temperatures(valid_time)
        if data is not None:
            return data
        path = write_region_temperatures(valid_time, source=source)
        if path is None:
            DemoIngestService().regenerate_temperature_for_time(valid_time)
            write_region_temperatures(valid_time, source=source)
        return read_region_temperatures(valid_time)

    def lookup(
        self,
        lat: float,
        lon: float,
        valid_time: str | None = None,
    ) -> RegionWeatherResult | None:
        lon_norm = ((lon + 180) % 360) - 180
        feature = get_region_index().find_feature(lon, lon_norm, lat)
        if feature is None:
            return None

        props = feature.get("properties", {})
        region_id = str(props.get("id") or props.get("name"))
        name = str(props.get("name") or region_id)
        name_zh = str(props.get("name_zh") or name)
        admin_level = str(props.get("admin_level", "country"))

        from shapely.geometry import shape

        geom = shape(feature["geometry"])
        bounds = list(geom.bounds)

        temp_c: float | None = None
        temp_max_c: float | None = None
        source = "none"
        confidence = "low"
        cell_count: int | None = None

        if valid_time:
            data = self.ensure_region_temps(valid_time)
            if data:
                row = data.get("regions", {}).get(region_id)
                if row:
                    temp_c = row.get("temp_c")
                    temp_max_c = row.get("temp_max_c")
                    source = row.get("source", data.get("source", "grid"))
                    cell_count = row.get("cell_count")
                    n = cell_count or 0
                    if n >= 20:
                        confidence = "high"
                    elif n >= 5:
                        confidence = "medium"

        return RegionWeatherResult(
            region_id=region_id,
            name=name,
            name_zh=name_zh,
            admin_level=admin_level,
            temp_c=temp_c,
            temp_max_c=temp_max_c,
            source=source,
            confidence=confidence,
            bounds=bounds,
            valid_time=valid_time,
            cell_count=cell_count,
        )
