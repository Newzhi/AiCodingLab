"""File-system implementation of GridRepository."""

from __future__ import annotations

import json
import shutil
from pathlib import Path

from app.config import settings
from app.domain.entities import DEPRECATED_LAYERS, LAYER_FILES, LayerId


class FileGridRepository:
    def __init__(self, processed_dir: Path | None = None) -> None:
        self._root = processed_dir or settings.processed_dir
        self._root.mkdir(parents=True, exist_ok=True)

    def time_dir(self, valid_time: str) -> Path:
        safe = valid_time.replace(":", "-")
        return self._root / safe

    def list_valid_times(self) -> list[str]:
        times: list[str] = []
        if not self._root.exists():
            return times
        for entry in sorted(self._root.iterdir()):
            if not entry.is_dir():
                continue
            meta = entry / "manifest.json"
            if meta.exists():
                data = json.loads(meta.read_text(encoding="utf-8"))
                times.append(data.get("valid_time", entry.name))
            elif (entry / "temperature.png").exists():
                name = entry.name
                if "T" in name and name.count("-") >= 3:
                    parts = name.split("T")
                    date = parts[0]
                    rest = parts[1].replace("-", ":")
                    times.append(f"{date}T{rest}")
                else:
                    times.append(name)
        return sorted(times)

    def read_manifest(self, valid_time: str) -> dict | None:
        path = self.time_dir(valid_time) / "manifest.json"
        if not path.exists():
            return None
        return json.loads(path.read_text(encoding="utf-8"))

    def write_manifest(self, valid_time: str, source: str, layers: list[str]) -> None:
        tdir = self.time_dir(valid_time)
        tdir.mkdir(parents=True, exist_ok=True)
        manifest = {
            "valid_time": valid_time,
            "source": source,
            "layers": layers,
        }
        (tdir / "manifest.json").write_text(
            json.dumps(manifest, indent=2),
            encoding="utf-8",
        )

    def layer_file_exists(self, valid_time: str, layer_id: str, file_key: str) -> bool:
        if layer_id not in LAYER_FILES:
            return False
        fname = LAYER_FILES[layer_id].get(file_key)
        if not fname:
            return False
        return (self.time_dir(valid_time) / fname).exists()

    def resolve_layer_assets(self, valid_time: str, layer_id: str) -> dict[str, str]:
        if layer_id in DEPRECATED_LAYERS:
            raise FileNotFoundError(DEPRECATED_LAYERS[layer_id])

        if layer_id not in LAYER_FILES:
            raise FileNotFoundError(f"Unknown layer: {layer_id}")

        tdir = self.time_dir(valid_time)
        if not tdir.exists():
            raise FileNotFoundError(f"No data for valid_time={valid_time}")

        safe_time = valid_time.replace(":", "-")
        base_url = f"/static/processed/{safe_time}"
        files: dict[str, str] = {}

        for key, fname in LAYER_FILES[layer_id].items():
            path = tdir / fname
            if not path.exists() and layer_id == LayerId.TERRAIN_CONTOURS:
                legacy = tdir / "isobars.geojson"
                if legacy.exists():
                    fname = "isobars.geojson"
                    path = legacy
            if not path.exists() and layer_id == LayerId.TEMPERATURE and key == "grid":
                continue
            if not path.exists():
                raise FileNotFoundError(f"Missing {fname} for {layer_id} at {valid_time}")
            files[key] = f"{base_url}/{fname}"

        return files

    def ensure_terrain_contours(self, valid_time: str) -> bool:
        """Copy legacy isobars or regenerate terrain contours if missing."""
        tdir = self.time_dir(valid_time)
        if not tdir.exists():
            return False
        target = tdir / "terrain_contours.geojson"
        if target.exists():
            return True
        legacy = tdir / "isobars.geojson"
        if legacy.exists():
            shutil.copy2(legacy, target)
            return True
        from app.infrastructure.processors.terrain_contours import write_terrain_contours_geojson

        write_terrain_contours_geojson(valid_time)
        return target.exists()

    def ensure_temperature_grid(self, valid_time: str) -> bool:
        """Regenerate temperature grid binary from PNG meta if missing."""
        tdir = self.time_dir(valid_time)
        grid_path = tdir / "temperature.grid.bin"
        if grid_path.exists():
            return True
        meta_path = tdir / "temperature.meta.json"
        if not meta_path.exists():
            return False
        from app.application.demo_ingest import DemoIngestService

        DemoIngestService(self).regenerate_temperature_for_time(valid_time)
        return grid_path.exists()


default_grid_repository = FileGridRepository()
