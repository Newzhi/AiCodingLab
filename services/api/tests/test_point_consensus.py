from app.application.point_consensus import compute_consensus, pick_primary, valid_temps
from app.domain.entities import PointWeatherSourceReading


def test_median_and_high_confidence():
    sources = [
        PointWeatherSourceReading("grid", 25.0, "ok"),
        PointWeatherSourceReading("open-meteo", 25.2, "ok"),
    ]
    temps = valid_temps(sources)
    consensus, confidence = compute_consensus(temps)
    assert consensus == 25.1
    assert confidence == "high"


def test_low_confidence_when_spread_large():
    sources = [
        PointWeatherSourceReading("grid", 20.0, "ok"),
        PointWeatherSourceReading("open-meteo", 25.0, "ok"),
    ]
    consensus, confidence = compute_consensus(valid_temps(sources))
    assert consensus == 22.5
    assert confidence == "low"


def test_pick_primary_prefers_grid():
    sources = [
        PointWeatherSourceReading("web-scrape", 24.0, "ok"),
        PointWeatherSourceReading("grid", 25.0, "ok"),
    ]
    assert pick_primary(sources) == "grid"
