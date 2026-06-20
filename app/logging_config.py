from __future__ import annotations

import sys
from loguru import logger
from .config import settings


def configure_logging() -> None:
    logger.remove()
    # Windows consoles default to cp1252, which raises UnicodeEncodeError on the
    # emoji used in log lines (e.g. "✅ NEW TOKEN") and drops those records.
    # Force UTF-8 (replacing any unencodable char) so logging never errors.
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass
    logger.add(
        sys.stdout,
        level=settings.log_level,
        format="{time:YYYY-MM-DD HH:mm:ss.SSS} | {level:<8} | {name}:{function}:{line} | {message}",
        enqueue=True,
        backtrace=False,
        diagnose=False,
    )


__all__ = ["configure_logging", "logger"]
