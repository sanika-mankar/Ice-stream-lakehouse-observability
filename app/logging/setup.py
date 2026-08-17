"""Structured logging setup for Ice Stream.

Provides structured logging with correlation IDs for request tracking.
"""

import logging
import logging.config

from app.config import settings


def setup_logging(log_level: str | None = None) -> logging.Logger:
    """Set up structured logging for the application.

    Args:
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
                  Defaults to settings.log_level

    Returns:
        Configured logger instance
    """
    if log_level is None:
        log_level = settings.log_level

    # Set up basic configuration
    logging_config = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "standard": {"format": "[%(asctime)s] [%(name)s] [%(levelname)s] %(message)s"},
            "json": {
                "format": '{"timestamp": "%(asctime)s", "name": "%(name)s", '
                '"level": "%(levelname)s", "message": "%(message)s"}'
            },
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "level": log_level,
                "formatter": "standard",
                "stream": "ext://sys.stdout",
            },
        },
        "root": {
            "level": log_level,
            "handlers": ["console"],
        },
    }

    logging.config.dictConfig(logging_config)

    logger = logging.getLogger(__name__)
    logger.info(
        "Logging configured",
        extra={"level": log_level, "debug": settings.debug},
    )
    return logger


def get_logger(name: str) -> logging.Logger:
    """Get a logger with the given name.

    Args:
        name: Logger name, typically __name__

    Returns:
        Logger instance
    """
    return logging.getLogger(name)


class CorrelationIDFilter(logging.Filter):
    """Add correlation ID to log records for tracing."""

    _correlation_id: str | None = None

    @classmethod
    def set_correlation_id(cls, correlation_id: str) -> None:
        """Set the correlation ID for this thread/request.

        Args:
            correlation_id: Unique identifier for this request
        """
        cls._correlation_id = correlation_id

    @classmethod
    def get_correlation_id(cls) -> str | None:
        """Get the current correlation ID.

        Returns:
            Current correlation ID or None
        """
        return cls._correlation_id

    def filter(self, record: logging.LogRecord) -> bool:
        """Add correlation ID to log record.

        Args:
            record: Log record to filter

        Returns:
            Always True to allow the record
        """
        record.correlation_id = self._correlation_id or "no-id"  # type: ignore
        return True
