from fastapi import APIRouter

router = APIRouter(prefix="/layers", tags=["layers"])

CATALOG = [
    {
        "id": "basemap",
        "name": "底图 (OSM)",
        "type": "imagery",
        "description": "OpenStreetMap 栅格瓦片（前端 UrlTemplateImageryProvider）",
        "source": "OpenStreetMap",
        "default": True,
    },
    {
        "id": "terrain",
        "name": "高程地形",
        "type": "terrain",
        "description": "Cesium World Terrain（需 VITE_CESIUM_ION_TOKEN）",
        "source": "Cesium Ion",
        "default": False,
    },
    {
        "id": "hillshade",
        "name": "高程着色",
        "type": "imagery_overlay",
        "description": "Esri World Hillshade 山体阴影叠加",
        "source": "Esri",
        "default": False,
    },
    {
        "id": "roads",
        "name": "路网",
        "type": "imagery_overlay",
        "description": "OSM HOT 路网强调半透明叠加",
        "source": "OpenStreetMap France HOT",
        "default": False,
    },
]


@router.get("/catalog")
def catalog():
    return {"layers": CATALOG}
