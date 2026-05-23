from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.jobs.scheduler import start_scheduler, stop_scheduler
from app.interfaces.routers import assets, boundaries, health, ingest, layers, query, times, weather


@asynccontextmanager
async def lifespan(_app: FastAPI):
    from app.infrastructure.boundaries import ensure_boundary_files

    ensure_boundary_files()
    start_scheduler()
    yield
    stop_scheduler()


app = FastAPI(
    title="Earth Map API",
    version="0.2.0",
    description="Map layer catalog and optional weather ingest (legacy) for Cesium globe",
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
app.include_router(boundaries.router)


@app.get("/")
def root():
    return {
        "service": "earth-map-api",
        "docs": "/docs",
        "health": "/health",
    }
