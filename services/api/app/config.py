from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(ROOT / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    api_host: str = "0.0.0.0"
    api_port: int = 8000
    data_dir: Path = ROOT / "data"
    processed_dir: Path = ROOT / "data" / "processed"
    raw_dir: Path = ROOT / "data" / "raw"
    point_weather_cache_dir: Path = ROOT / "data" / "cache" / "point_weather"
    point_weather_cache_ttl_sec: int = 900
    point_multi_cache_ttl_sec: int = 900
    point_provider_timeout_sec: float = 12.0

    enable_web_weather: bool = True
    openweather_api_key: str = ""

    gfs_model: str = "gfs"
    gfs_product: str = "0p25"
    gfs_forecast_hours: str = "0,6,12"

    cmems_username: str = ""
    cmems_password: str = ""
    cmems_dataset_id: str = "cmems_mod_glo_phy-cur_anfc_0.083deg_PT6H-i"
    enable_scheduler: bool = False

    @property
    def forecast_hours(self) -> list[int]:
        return [int(h.strip()) for h in self.gfs_forecast_hours.split(",") if h.strip()]


settings = Settings()
settings.processed_dir.mkdir(parents=True, exist_ok=True)
settings.raw_dir.mkdir(parents=True, exist_ok=True)
settings.point_weather_cache_dir.mkdir(parents=True, exist_ok=True)
