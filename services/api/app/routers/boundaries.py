from __future__ import annotations

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, JSONResponse

from app.config import settings
from app.infrastructure.boundaries import ensure_boundary_files, load_geojson

router = APIRouter(prefix="/boundaries", tags=["boundaries"])


@router.get("/countries")
def get_countries_geojson():
    ensure_boundary_files()
    path = settings.boundaries_dir / "countries.geojson"
    if not path.exists():
        raise HTTPException(status_code=404, detail="countries.geojson not found")
    return FileResponse(path, media_type="application/geo+json")


@router.get("/china_provinces")
def get_china_provinces_geojson():
    ensure_boundary_files()
    path = settings.boundaries_dir / "china_provinces.geojson"
    if not path.exists():
        raise HTTPException(status_code=404, detail="china_provinces.geojson not found")
    return FileResponse(path, media_type="application/geo+json")


@router.post("/lookup")
def boundary_lookup(body: dict):
    """Return GeoJSON feature for lat/lon (client-side fallback helper)."""
    lat = float(body.get("lat", 0))
    lon = float(body.get("lon", 0))
    from app.application.region_weather import RegionWeatherService

    result = RegionWeatherService().lookup(lat, lon, valid_time=None)
    if result is None:
        raise HTTPException(status_code=404, detail="No region at point")
    return JSONResponse(
        {
            "region_id": result.region_id,
            "name": result.name,
            "name_zh": result.name_zh,
            "bounds": result.bounds,
            "feature": load_geojson("countries.geojson"),
        }
    )
