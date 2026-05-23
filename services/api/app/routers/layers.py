from fastapi import APIRouter

router = APIRouter(prefix="/layers", tags=["layers"])

CATALOG = [
    {
        "id": "basemap",
        "name": "底图",
        "type": "imagery",
        "description": "Cesium Ion / OSM 底图",
        "default": True,
    },
    {
        "id": "temperature",
        "name": "气温 (2m)",
        "type": "scalar_texture",
        "variable": "t2m",
        "source": "NOAA GFS via Herbie",
        "default": True,
    },
    {
        "id": "isobars",
        "name": "等压线",
        "type": "geojson",
        "variable": "msl",
        "source": "NOAA GFS via Herbie",
        "default": False,
    },
    {
        "id": "wind",
        "name": "风场粒子",
        "type": "uv_particles",
        "variables": ["u10", "v10"],
        "source": "NOAA GFS via Herbie",
        "default": False,
    },
    {
        "id": "ocean",
        "name": "洋流粒子",
        "type": "uv_particles",
        "variables": ["uo", "vo"],
        "source": "Copernicus Marine",
        "default": False,
    },
]


@router.get("/catalog")
def catalog():
    return {"layers": CATALOG}
