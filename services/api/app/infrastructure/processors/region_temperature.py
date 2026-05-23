"""Regional mean temperature from GFS/demo grid inside admin polygons."""

from __future__ import annotations

import json
import logging
from functools import lru_cache
from pathlib import Path

import numpy as np
from shapely.geometry import Point, shape
from shapely.prepared import prep
from shapely.strtree import STRtree

from app.config import settings
from app.infrastructure.processors.temperature import read_temperature_grid

logger = logging.getLogger(__name__)

REGION_TEMPS_FILE = "region_temperatures.json"


@lru_cache(maxsize=4)
def _load_boundary_features(path: Path) -> list[dict]:
    if not path.exists():
        return []
    data = json.loads(path.read_text(encoding="utf-8"))
    return list(data.get("features", []))


def _feature_bounds(feature: dict) -> tuple[float, float, float, float]:
    geom = shape(feature["geometry"])
    minx, miny, maxx, maxy = geom.bounds
    return minx, miny, maxx, maxy


def _grid_cell_centers(meta: dict) -> tuple[np.ndarray, np.ndarray]:
    west, south, east, north = meta["bounds"]
    width = int(meta["width"])
    height = int(meta["height"])
    lons = west + (np.arange(width) + 0.5) * (east - west) / width
    lats = north - (np.arange(height) + 0.5) * (north - south) / height
    lon2d, lat2d = np.meshgrid(lons, lats)
    return lon2d.ravel(), lat2d.ravel()


def _aggregate_region(
    grid_flat: np.ndarray,
    lon_flat: np.ndarray,
    lat_flat: np.ndarray,
    feature: dict,
) -> tuple[float | None, float | None, int]:
    props = feature.get("properties", {})
    geom = shape(feature["geometry"])
    prepared = prep(geom)
    minx, miny, maxx, maxy = geom.bounds

    mask = (
        (lon_flat >= minx)
        & (lon_flat <= maxx)
        & (lat_flat >= miny)
        & (lat_flat <= maxy)
    )
    if not np.any(mask):
        return None, None, 0

    idx = np.where(mask)[0]
    temps: list[float] = []
    for i in idx:
        if prepared.contains(Point(float(lon_flat[i]), float(lat_flat[i]))):
            temps.append(float(grid_flat[i]))

    if not temps:
        return None, None, 0

    arr = np.asarray(temps, dtype=float)
    return float(np.mean(arr)), float(np.max(arr)), int(len(arr))


def write_region_temperatures(valid_time: str, source: str = "grid") -> Path | None:
    loaded = read_temperature_grid(valid_time)
    if loaded is None:
        logger.warning("No temperature grid for %s; skip region temperatures", valid_time)
        return None

    grid, meta = loaded
    grid_flat = grid.ravel()
    lon_flat, lat_flat = _grid_cell_centers(meta)

    boundaries_dir = settings.boundaries_dir
    features: list[dict] = []
    for name in ("countries.geojson", "china_provinces.geojson"):
        features.extend(_load_boundary_features(boundaries_dir / name))

    if not features:
        from app.infrastructure.boundaries import ensure_boundary_files

        ensure_boundary_files()
        for name in ("countries.geojson", "china_provinces.geojson"):
            features.extend(_load_boundary_features(boundaries_dir / name))

    regions: dict[str, dict] = {}
    for feature in features:
        props = feature.get("properties", {})
        region_id = str(props.get("id") or props.get("ISO_A3") or props.get("name"))
        mean_c, max_c, n = _aggregate_region(grid_flat, lon_flat, lat_flat, feature)
        if n == 0 or mean_c is None:
            continue
        geom = shape(feature["geometry"])
        minx, miny, maxx, maxy = geom.bounds
        regions[region_id] = {
            "id": region_id,
            "name": props.get("name") or region_id,
            "name_zh": props.get("name_zh") or props.get("NAME_ZH") or props.get("name"),
            "admin_level": props.get("admin_level", "country"),
            "temp_c": round(mean_c, 2),
            "temp_max_c": round(max_c, 2) if max_c is not None else None,
            "cell_count": n,
            "source": source,
            "bounds": [minx, miny, maxx, maxy],
        }

    tdir = settings.processed_dir / valid_time.replace(":", "-")
    tdir.mkdir(parents=True, exist_ok=True)
    out_path = tdir / REGION_TEMPS_FILE
    payload = {
        "valid_time": valid_time,
        "source": source,
        "method": "mean_of_grid_cells_inside_polygon",
        "regions": regions,
    }
    out_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return out_path


def read_region_temperatures(valid_time: str) -> dict | None:
    tdir = settings.processed_dir / valid_time.replace(":", "-")
    path = tdir / REGION_TEMPS_FILE
    if not path.exists():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


@lru_cache(maxsize=8)
def _region_index_for_file(geojson_path: str) -> tuple[STRtree, list[dict], list[str]]:
    features = _load_boundary_features(Path(geojson_path))
    geoms = [shape(f["geometry"]) for f in features]
    ids = [
        str(f.get("properties", {}).get("id") or f.get("properties", {}).get("name"))
        for f in features
    ]
    tree = STRtree(geoms)
    return tree, features, ids


class RegionIndex:
    """Spatial index for point-in-polygon region lookup."""

    def __init__(self) -> None:
        from app.infrastructure.boundaries import ensure_boundary_files

        ensure_boundary_files()
        self._trees: list[tuple[STRtree, list[dict]]] = []
        boundaries_dir = settings.boundaries_dir
        for fname in ("china_provinces.geojson", "countries.geojson"):
            path = boundaries_dir / fname
            if not path.exists():
                continue
            tree, features, _ = _region_index_for_file(str(path.resolve()))
            self._trees.append((tree, features))

    def find_feature(self, lon: float, lon_norm: float, lat: float) -> dict | None:
        point = Point(lon_norm, lat)
        best: dict | None = None
        best_area = float("inf")
        for tree, features in self._trees:
            hits = tree.query(point)
            if hits is None:
                continue
            for idx in hits:
                feat = features[int(idx)]
                geom = shape(feat["geometry"])
                if geom.contains(point):
                    area = geom.area
                    if area < best_area:
                        best_area = area
                        best = feat
        return best


_default_index: RegionIndex | None = None


def get_region_index() -> RegionIndex:
    global _default_index
    if _default_index is None:
        _default_index = RegionIndex()
    return _default_index
