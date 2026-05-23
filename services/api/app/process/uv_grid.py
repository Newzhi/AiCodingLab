from __future__ import annotations

import json
import struct
from pathlib import Path

import numpy as np

from app.config import settings


def write_uv_assets(
    valid_time: str,
    prefix: str,
    lons: np.ndarray,
    lats: np.ndarray,
    u: np.ndarray,
    v: np.ndarray,
) -> None:
    safe = valid_time.replace(":", "-")
    tdir = settings.processed_dir / safe
    tdir.mkdir(parents=True, exist_ok=True)

    u_flat = np.asarray(u, dtype=np.float32).ravel()
    v_flat = np.asarray(v, dtype=np.float32).ravel()
    bin_path = tdir / f"{prefix}.uv.bin"
    with bin_path.open("wb") as f:
        f.write(struct.pack(f"{len(u_flat)}f", *u_flat))
        f.write(struct.pack(f"{len(v_flat)}f", *v_flat))

    meta = {
        "valid_time": valid_time,
        "width": int(len(lons)),
        "height": int(len(lats)),
        "bounds": [float(lons.min()), float(lats.min()), float(lons.max()), float(lats.max())],
        "u_min": float(np.nanmin(u)),
        "u_max": float(np.nanmax(u)),
        "v_min": float(np.nanmin(v)),
        "v_max": float(np.nanmax(v)),
        "speed_max": float(np.nanmax(np.hypot(u, v))),
    }
    (tdir / f"{prefix}.uv.json").write_text(
        json.dumps(meta, indent=2),
        encoding="utf-8",
    )
