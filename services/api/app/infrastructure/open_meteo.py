"""Open-Meteo point temperature provider (optional enrichment, rate-limit aware).

Deprecated: use app.infrastructure.providers.open_meteo_provider instead.
"""

from app.infrastructure.providers.open_meteo_provider import (
    OpenMeteoProvider as OpenMeteoClient,
    default_open_meteo_provider as default_open_meteo_client,
)

__all__ = ["OpenMeteoClient", "default_open_meteo_client"]
