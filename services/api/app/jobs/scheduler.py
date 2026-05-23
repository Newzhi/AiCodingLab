from __future__ import annotations

import logging

from apscheduler.schedulers.background import BackgroundScheduler

from app.ingest.gfs import ingest_gfs

logger = logging.getLogger(__name__)
_scheduler: BackgroundScheduler | None = None


def start_scheduler() -> None:
    global _scheduler
    if _scheduler is not None:
        return
    _scheduler = BackgroundScheduler()
    # Every 6 hours — GFS cycle; disable in dev by commenting out
    _scheduler.add_job(ingest_gfs, "interval", hours=6, id="gfs_ingest", replace_existing=True)
    _scheduler.start()
    logger.info("APScheduler started (GFS ingest every 6h)")


def stop_scheduler() -> None:
    global _scheduler
    if _scheduler:
        _scheduler.shutdown(wait=False)
        _scheduler = None
