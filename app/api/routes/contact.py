"""Contact Us API routes for Ice Stream platform."""

import logging
import os
import smtplib
from email.message import EmailMessage
from pathlib import Path
from typing import Dict, Any

from dotenv import load_dotenv
from fastapi import APIRouter
from pydantic import BaseModel, EmailStr

# Load environment variables from project root and frontend if present
BASE_DIR = Path(__file__).resolve().parents[3]
load_dotenv(BASE_DIR / "frontend" / ".env")
load_dotenv(BASE_DIR / ".env")
load_dotenv()

logger = logging.getLogger("ice_stream.api.contact")

router = APIRouter(tags=["Contact"])

DEFAULT_SANTOSH_EMAIL = "Sant7124@gmail.com"
DEFAULT_SANIKA_EMAIL = "sanikamankar74@gmail.com"


class ContactRequest(BaseModel):
    name: str
    email: EmailStr
    subject: str
    message: str


@router.post("/contact", response_model=Dict[str, Any])
def submit_contact(contact: ContactRequest):
    """Handle contact submission and forward via SMTP email to both Santosh and Sanika."""
    try:
        # Load credentials and recipients
        email_user = (os.getenv("EMAIL_USER") or os.getenv("SANTOSH_EMAIL") or DEFAULT_SANIKA_EMAIL).strip('\"\' ')
        email_password = os.getenv("EMAIL_PASSWORD")
        if email_password:
            email_password = email_password.replace(" ", "").strip('\"\' ')
        santosh_email = (os.getenv("SANTOSH_EMAIL") or DEFAULT_SANTOSH_EMAIL).strip('\"\' ')
        copy_email = (os.getenv("COPY_EMAIL") or DEFAULT_SANIKA_EMAIL).strip('\"\' ')

        recipients = list(dict.fromkeys([santosh_email, copy_email]))

        if not email_password:
            err_msg = (
                "SMTP Authentication Error: 'EMAIL_PASSWORD' is not set in .env. "
                "Gmail requires a 16-character Google App Password (not your personal password). "
                "Please add EMAIL_USER and EMAIL_PASSWORD to your .env file."
            )
            logger.error(err_msg)
            return {
                "success": False,
                "message": err_msg,
                "recipients": recipients
            }

        msg = EmailMessage()
        msg["Subject"] = f"[Ice Stream Contact] {contact.subject}"
        msg["From"] = email_user
        msg["To"] = santosh_email
        msg["Cc"] = copy_email
        msg["Reply-To"] = contact.email

        msg.set_content(
            f"""
New inquiry submitted via Ice Stream Contact Us portal:

--------------------------------------------------
Sender Name:    {contact.name}
Sender Email:   {contact.email}
Subject:        {contact.subject}
--------------------------------------------------

Message:
{contact.message}

--------------------------------------------------
This message was automatically forwarded to:
- {santosh_email}
- {copy_email}
"""
        )

        logger.info(f"Dispatching contact email via smtp.gmail.com to {recipients}...")
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
            smtp.login(email_user, email_password)
            smtp.send_message(msg, to_addrs=recipients)
            logger.info(f"Contact email successfully delivered to {recipients}")

        return {
            "success": True,
            "message": f"Message sent successfully to {santosh_email} and {copy_email}!",
            "recipients": recipients
        }

    except smtplib.SMTPAuthenticationError as auth_err:
        err_str = (
            f"Gmail Authentication Failed: {auth_err}. "
            "Please check that EMAIL_USER and EMAIL_PASSWORD in .env use a valid 16-character Google App Password."
        )
        logger.error(err_str)
        return {
            "success": False,
            "message": err_str
        }

    except Exception as error:
        err_str = f"Email delivery failed: {str(error)}"
        logger.error(err_str, exc_info=True)
        return {
            "success": False,
            "message": err_str
        }
