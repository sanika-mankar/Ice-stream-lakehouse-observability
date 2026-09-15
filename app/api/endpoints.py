"""Endpoints compatibility module for Ice Stream API.

Re-exports the Contact router and operational API endpoints.
"""

from app.api.routes.contact import router, ContactRequest, submit_contact

__all__ = ["router", "ContactRequest", "submit_contact"]