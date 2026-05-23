from fastapi import APIRouter, HTTPException

from app.services.catalog import get_time_manifest, list_valid_times

router = APIRouter(tags=["times"])


@router.get("/times")
def times():
    valid_times = list_valid_times()
    return {"times": valid_times, "default": valid_times[0] if valid_times else None}


@router.get("/times/{valid_time}/manifest")
def time_manifest(valid_time: str):
    manifest = get_time_manifest(valid_time)
    if manifest is None:
        raise HTTPException(status_code=404, detail=f"No manifest for valid_time={valid_time}")
    return manifest
