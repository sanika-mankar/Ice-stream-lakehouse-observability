"""Configuration management for Ice Stream.

Provides typed, environment-driven configuration with Pydantic.
"""

from dataclasses import dataclass
from os import getenv
from typing import Optional


@dataclass
class Settings:
    """Application configuration.
    
    All settings are loaded from environment variables with sensible defaults.
    Use .env.example as a template for your .env file.
    """

    # Application
    app_env: str = getenv("APP_ENV", "development")
    log_level: str = getenv("LOG_LEVEL", "INFO")
    debug: bool = getenv("DEBUG", "false").lower() in ("true", "1", "yes")

    # Kafka Configuration
    kafka_bootstrap_servers: str = getenv(
        "KAFKA_BOOTSTRAP_SERVERS", "localhost:9092"
    )
    kafka_topic: str = getenv("KAFKA_TOPIC", "transactions")
    kafka_group_id: str = getenv("KAFKA_GROUP_ID", "ice-stream-consumer")
    kafka_auto_offset_reset: str = getenv("KAFKA_AUTO_OFFSET_RESET", "earliest")
    kafka_security_protocol: str = getenv("KAFKA_SECURITY_PROTOCOL", "PLAINTEXT")

    # Storage Configuration
    duckdb_path: str = getenv("DUCKDB_PATH", "data/ice_stream.duckdb")
    data_dir: str = getenv("DATA_DIR", "data/")
    clean_data_path: str = getenv("CLEAN_DATA_PATH", "data/clean/")
    quarantine_data_path: str = getenv("QUARANTINE_DATA_PATH", "data/quarantine/")

    # Pipeline Configuration
    transaction_batch_size: int = int(getenv("TRANSACTION_BATCH_SIZE", "1000"))
    validation_timeout_seconds: int = int(
        getenv("VALIDATION_TIMEOUT_SECONDS", "30")
    )
    max_quarantine_size: int = int(getenv("MAX_QUARANTINE_SIZE", "100000"))

    # Dashboard Configuration
    dashboard_port: int = int(getenv("DASHBOARD_PORT", "8501"))
    dashboard_host: str = getenv("DASHBOARD_HOST", "localhost")

    # Observability
    metrics_enabled: bool = getenv("METRICS_ENABLED", "true").lower() in (
        "true",
        "1",
        "yes",
    )
    health_check_interval: int = int(getenv("HEALTH_CHECK_INTERVAL", "60"))

    # Database
    database_url: str = getenv("DATABASE_URL", "sqlite:///./data/ice_stream.db")

    # Debugging
    verbose_logging: bool = getenv("VERBOSE_LOGGING", "false").lower() in (
        "true",
        "1",
        "yes",
    )

    def is_production(self) -> bool:
        """Check if running in production mode.
        
        Returns:
            True if APP_ENV is production
        """
        return self.app_env == "production"

    def is_development(self) -> bool:
        """Check if running in development mode.
        
        Returns:
            True if APP_ENV is development
        """
        return self.app_env == "development"


# Global settings instance
settings = Settings()
