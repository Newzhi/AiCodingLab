from fastapi import APIRouter, HTTPException, Query

from app.services.catalog import list_valid_times, get_time_manifest

router = APIRouter(tags=["times"])


@router.get("/times")
def times():
    valid_times = list_valid_times()
    return {"times": valid_times, "default": valid_times[0] if valid_times else None}


@router.get("/times/manifest")
def time_manifest(valid_time: str = Query(..., description="ISO valid_time")):
    manifest = get_time_manifest(valid_time)
    if manifest is None:
        raise HTTPException(status_code=404, detail=f"No manifest for valid_time={valid_time}")
    return manifest
