from __future__ import annotations

from fastapi import APIRouter, Query

from app.application.point_multi_query import PointMultiQueryService
from app.application.point_query import PointQueryService
from app.application.region_weather import RegionWeatherService
from app.config import settings

router = APIRouter(prefix="/weather", tags=["weather"])


@router.get("/point")
def query_point_weather(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    valid_time: str | None = Query(None, description="ISO valid_time for grid sampling"),
    open_meteo: bool = Query(True, description="Allow Open-Meteo fallback when grid unavailable"),
    prefer_web: bool = Query(False, description="Skip grid; use Open-Meteo / wttr.in chain"),
    allow_scrape: bool = Query(
        True,
        description="Allow wttr.in when enable_web_weather and prefer_web",
    ),
):
    """Grid first, or web chain when prefer_web=true (Open-Meteo → wttr.in)."""
    service = PointQueryService()
    if prefer_web and settings.enable_web_weather:
        result = service.query_point(
            lat,
            lon,
            valid_time,
            prefer_web=True,
            allow_web=open_meteo,
            allow_scrape=allow_scrape,
        )
    else:
        result = service.query_temperature(
            lat=lat,
            lon=lon,
            valid_time=valid_time,
            allow_open_meteo=open_meteo,
        )
    return result.to_dict()


@router.get("/point/multi")
def query_point_weather_multi(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    valid_time: str | None = Query(None, description="ISO valid_time for grid sampling"),
    allow_scrape: bool = Query(True, description="Include wttr.in when enable_web_weather"),
    use_cache: bool = Query(True, description="Use file cache (lat/lon rounded to 2 decimals)"),
):
    """Parallel multi-provider fetch with median consensus and confidence."""
    result = PointMultiQueryService().query_multi(
        lat=lat,
        lon=lon,
        valid_time=valid_time,
        allow_scrape=allow_scrape,
        use_cache=use_cache,
    )
    return result.to_dict()


@router.get("/region")
def query_region_weather(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    valid_time: str | None = Query(None, description="ISO valid_time for regional grid mean"),
):
    """Regional mean temperature from precomputed grid aggregation inside admin polygon."""
    result = RegionWeatherService().lookup(lat, lon, valid_time=valid_time)
    if result is None:
        return {
            "region_id": None,
            "name": None,
            "name_zh": None,
            "temp_c": None,
            "source": "none",
            "confidence": "low",
            "bounds": None,
            "valid_time": valid_time,
        }
    return result.to_dict()
