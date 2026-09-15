"""Contact Us API routes for Ice Stream platform."""

import logging
import os
import smtplib
from email.message import EmailMessage
from pathlib import Path
from typing import Dict, Any

from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr

# Load environment variables from project root and frontend if present
BASE_DIR = Path(__file__).resolve().parents[3]
load_dotenv(BASE_DIR / "frontend" / ".env")
load_dotenv(BASE_DIR / ".env")
load_dotenv()

logger = logging.getLogger("ice_stream.api.contact")

router = APIRouter(tags=["Contact"])


class ContactRequest(BaseModel):
    name: str
    email: EmailStr
    subject: str
    message: str


@router.post("/contact", response_model=Dict[str, Any])
def submit_contact(contact: ContactRequest):
    """Handle contact submission and forward via SMTP email."""
    try:
        email_user = os.getenv("EMAIL_USER")
        email_password = os.getenv("EMAIL_PASSWORD")
        santosh_email = os.getenv("SANTOSH_EMAIL", "sant781999@gmail.com")
        copy_email = os.getenv("COPY_EMAIL")

        if not email_user or not email_password:
            logger.warning("EMAIL_USER or EMAIL_PASSWORD not configured. Logging contact message locally.")
            logger.info(f"Contact form submitted from {contact.name} ({contact.email}): {contact.subject} - {contact.message}")
            return {
                "success": True,
                "message": "Message received successfully (local test mode: SMTP credentials not set)."
            }

        msg = EmailMessage()
        msg["Subject"] = f"Ice Stream Contact: {contact.subject}"
        msg["From"] = email_user
        msg["To"] = santosh_email
        if copy_email:
            msg["Cc"] = copy_email

        msg.set_content(
            f"""
New message received from Ice Stream Contact Us page.

Name: {contact.name}
Email: {contact.email}
Subject: {contact.subject}

Message:
{contact.message}
"""
        )

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
            logger.info("Connecting to SMTP...")
            smtp.login(email_user, email_password)
            smtp.send_message(msg)
            logger.info("Contact email sent successfully")

        return {
            "success": True,
            "message": "Message sent successfully"
        }

    except Exception as error:
        logger.error(f"Email delivery failed: {error}", exc_info=True)
        return {
            "success": False,
            "message": str(error)
        }
