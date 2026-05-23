from __future__ import annotations

from app.domain.entities import DEPRECATED_LAYERS, LAYER_FILES
from app.infrastructure.file_storage import FileGridRepository, default_grid_repository


class LayerCatalogService:
    def __init__(self, repo: FileGridRepository | None = None) -> None:
        self._repo = repo or default_grid_repository

    def list_valid_times(self) -> list[str]:
        return self._repo.list_valid_times()

    def get_time_manifest(self, valid_time: str) -> dict | None:
        return self._repo.read_manifest(valid_time)

    def get_layer_assets(self, valid_time: str, layer_id: str) -> dict:
        if layer_id in DEPRECATED_LAYERS:
            raise FileNotFoundError(DEPRECATED_LAYERS[layer_id])
        if layer_id not in LAYER_FILES:
            raise FileNotFoundError(f"Unknown layer: {layer_id}")

        self._repo.ensure_terrain_contours(valid_time)

        files = self._repo.resolve_layer_assets(valid_time, layer_id)
        return {
            "valid_time": valid_time,
            "layer_id": layer_id,
            "files": files,
        }


def list_valid_times() -> list[str]:
    return LayerCatalogService().list_valid_times()


def get_time_manifest(valid_time: str) -> dict | None:
    return LayerCatalogService().get_time_manifest(valid_time)


def get_layer_assets(valid_time: str, layer_id: str) -> dict:
    return LayerCatalogService().get_layer_assets(valid_time, layer_id)
