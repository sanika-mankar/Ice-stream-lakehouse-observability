"""Ice Stream application entrypoint.

Delegates directly to the authoritative FastAPI application in app.api.main.
"""

from app.api.main import app

__all__ = ["app"]
