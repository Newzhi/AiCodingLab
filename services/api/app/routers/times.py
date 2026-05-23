from fastapi import APIRouter

from app.services.catalog import list_valid_times

router = APIRouter(tags=["times"])


@router.get("/times")
def times():
    valid_times = list_valid_times()
    return {"times": valid_times, "default": valid_times[0] if valid_times else None}
