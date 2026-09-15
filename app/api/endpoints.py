from fastapi import APIRouter, Path
from typing import Dict, Any

router = APIRouter()

@router.get("/health", response_model=Dict[str, Any])
def get_health():
    """
    Contract for /api/health endpoint.
    Returns the overall health status of the backend services.
    Currently returns a SIMULATION object as the real infrastructure is not yet connected.
    """
    return {
        "status": "HEALTHY",
        "message": "SIMULATION: Backend infrastructure not yet connected.",
        "services": {
            "kafka": "SIMULATED",
            "flink": "SIMULATED",
            "iceberg": "SIMULATED"
        }
    }

@router.get("/metrics", response_model=Dict[str, Any])
def get_metrics():
    """
    Contract for /api/metrics endpoint.
    """
    return {
        "message": "SIMULATION: Metrics backend not connected.",
        "data": []
    }

@router.get("/pipeline", response_model=Dict[str, Any])
def get_pipeline():
    """
    Contract for /api/pipeline endpoint.
    """
    return {
        "message": "SIMULATION: Pipeline backend not connected.",
        "nodes": [],
        "edges": [],
        "status": "HEALTHY"
    }

@router.get("/quality", response_model=Dict[str, Any])
def get_quality():
    """
    Contract for /api/quality endpoint.
    """
    return {
        "message": "SIMULATION: Quality backend not connected.",
        "metrics": {},
        "recent_violations": []
    }

@router.get("/incidents", response_model=Dict[str, Any])
def get_incidents():
    """
    Contract for /api/incidents endpoint.
    """
    return {
        "message": "SIMULATION: Incidents backend not connected.",
        "active_incidents": [],
        "past_incidents": []
    }

@router.get("/dlq", response_model=Dict[str, Any])
def get_dlq():
    """
    Contract for /api/dlq endpoint.
    """
    return {
        "message": "SIMULATION: DLQ backend not connected.",
        "records": []
    }

@router.get("/snapshots", response_model=Dict[str, Any])
def get_snapshots():
    """
    Contract for /api/snapshots endpoint.
    """
    return {
        "message": "SIMULATION: Iceberg snapshots backend not connected.",
        "snapshots": []
    }

@router.get("/system", response_model=Dict[str, Any])
def get_system():
    """
    Contract for /api/system endpoint.
    """
    return {
        "message": "SIMULATION: System backend not connected.",
        "health": "HEALTHY",
        "services": [],
        "circuit_breakers": []
    }
from pydantic import BaseModel, EmailStr
from fastapi import HTTPException
import os
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv
from pathlib import Path as FilePath
BASE_DIR = FilePath(__file__).resolve().parents[2]
load_dotenv(BASE_DIR / "frontend" / ".env")

load_dotenv()


class ContactRequest(BaseModel):
    name: str
    email: EmailStr
    subject: str
    message: str


@router.post("/contact")
def submit_contact(contact: ContactRequest):
    try:
        email_user = os.getenv("EMAIL_USER")
        email_password = os.getenv("EMAIL_PASSWORD")
        santosh_email = os.getenv("SANTOSH_EMAIL")
        copy_email = os.getenv("COPY_EMAIL")

        msg = EmailMessage()
        msg["Subject"] = f"Ice Stream Contact: {contact.subject}"
        msg["From"] = email_user
        msg["To"] = santosh_email
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
            print("SMTP connected")
            smtp.login(email_user, email_password)
            print("SMTP login successful")
            smtp.send_message(msg)
            print("Email sent successfully")

        return {
            "success": True,
            "message": "Message sent successfully"
        }

    except Exception as error:
        print("Email Error:", error)
        return {
            "success": False,
            "message": str(error)
        }