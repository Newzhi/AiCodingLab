"""Admin boundary GeoJSON — ensure seeded files exist."""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

from app.config import settings


def ensure_boundary_files() -> None:
    countries = settings.boundaries_dir / "countries.geojson"
    if countries.exists():
        return
    script = Path(__file__).resolve().parents[2] / "scripts" / "seed_boundaries.py"
    if script.exists():
        subprocess.run([sys.executable, str(script)], check=False, cwd=str(script.parents[2]))


def load_geojson(name: str) -> dict:
    ensure_boundary_files()
    path = settings.boundaries_dir / name
    if not path.exists():
        return {"type": "FeatureCollection", "features": []}
    return json.loads(path.read_text(encoding="utf-8"))
