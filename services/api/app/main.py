from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.jobs.scheduler import start_scheduler, stop_scheduler
from app.interfaces.routers import assets, health, ingest, layers, query, times, weather


@asynccontextmanager
async def lifespan(_app: FastAPI):
    from app.application.demo_ingest import DemoIngestService
    from app.application.layer_catalog import list_valid_times

    service = DemoIngestService()
    if not list_valid_times():
        service.generate_demo_times()
    else:
        service.repair_existing_times()
    start_scheduler()
    yield
    stop_scheduler()


app = FastAPI(
    title="Earth Weather API",
    version="0.1.0",
    description="GFS/CMEMS preprocessing and layer assets for Cesium",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

processed_path = Path(settings.processed_dir)
processed_path.mkdir(parents=True, exist_ok=True)
app.mount(
    "/static/processed",
    StaticFiles(directory=str(processed_path)),
    name="processed",
)

app.include_router(health.router)
app.include_router(layers.router)
app.include_router(times.router)
app.include_router(assets.router)
app.include_router(ingest.router)
app.include_router(query.router)
app.include_router(weather.router)


@app.get("/")
def root():
    return {
        "service": "earth-weather-api",
        "docs": "/docs",
        "health": "/health",
    }
