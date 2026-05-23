from fastapi import APIRouter, BackgroundTasks, HTTPException

from app.process.demo import generate_demo_times
from app.ingest.cmems import ingest_cmems_for_time
from app.ingest.gfs import ingest_gfs

router = APIRouter(prefix="/ingest", tags=["ingest"])


@router.post("/demo")
def ingest_demo():
    times = generate_demo_times()
    return {"status": "ok", "valid_times": times, "message": "Demo assets generated"}


@router.post("/gfs")
def trigger_gfs(background_tasks: BackgroundTasks):
    background_tasks.add_task(ingest_gfs)
    return {"status": "accepted", "message": "GFS ingest started in background"}


@router.post("/cmems")
def trigger_cmems(valid_time: str | None = None):
    try:
        result = ingest_cmems_for_time(valid_time)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    return result
