"""RAII helpers for xarray datasets and temp files."""

from __future__ import annotations

import tempfile
from contextlib import contextmanager
from pathlib import Path
from typing import Generator, Iterator

import xarray as xr


@contextmanager
def open_dataset(path: str | Path, **kwargs) -> Generator[xr.Dataset, None, None]:
    """Open an xarray dataset and guarantee close on exit."""
    ds = xr.open_dataset(path, **kwargs)
    try:
        yield ds
    finally:
        ds.close()


@contextmanager
def temp_grib_file(suffix: str = ".grib2") -> Iterator[Path]:
    """Create a temporary file path; delete on exit."""
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        path = Path(tmp.name)
    try:
        yield path
    finally:
        path.unlink(missing_ok=True)
