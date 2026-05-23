"""Backward-compatible re-exports — prefer app.application.demo_ingest."""

from app.application.demo_ingest import DemoIngestService, generate_demo_times

__all__ = ["DemoIngestService", "generate_demo_times"]
