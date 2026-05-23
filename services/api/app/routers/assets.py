from fastapi import APIRouter, HTTPException

from app.services.catalog import get_layer_assets

router = APIRouter(prefix="/assets", tags=["assets"])


@router.get("/{valid_time}/{layer_id}")
def assets(valid_time: str, layer_id: str):
    try:
        payload = get_layer_assets(valid_time, layer_id)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return payload
