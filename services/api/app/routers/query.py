from __future__ import annotations

from fastapi import APIRouter, Query

from app.application.point_query import PointQueryService

router = APIRouter(prefix="/query", tags=["query"])


@router.get("/temperature")
def query_temperature(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    valid_time: str | None = Query(None, description="ISO valid_time for grid sampling"),
    open_meteo: bool = Query(True, description="Allow Open-Meteo fallback when grid unavailable"),
):
    result = PointQueryService().query_temperature(
        lat=lat,
        lon=lon,
        valid_time=valid_time,
        allow_open_meteo=open_meteo,
    )
    return result.to_dict()
