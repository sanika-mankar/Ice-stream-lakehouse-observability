import os
import smtplib
from email.message import EmailMessage

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, EmailStr

load_dotenv()

app = FastAPI(title="Ice Stream Contact API")


class ContactForm(BaseModel):
    name: str
    email: EmailStr
    subject: str
    message: str


@app.get("/")
def home():
    return {
        "message": "Ice Stream Contact API is running"
    }


@app.post("/contact")
def submit_contact_form(contact: ContactForm):
    try:
        email_user = os.getenv("EMAIL_USER")
        email_password = os.getenv("EMAIL_PASSWORD")
        santosh_email = os.getenv("SANTOSH_EMAIL")
        copy_email = os.getenv("COPY_EMAIL")

        if not email_user or not email_password:
            raise HTTPException(
                status_code=500,
                detail="Email configuration is missing"
            )

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

        with smtplib.SMTP("smtp.gmail.com", 587) as smtp:
            smtp.starttls()
            smtp.login(email_user, email_password)
            smtp.send_message(msg)

        return {
            "success": True,
            "message": "Message sent successfully"
        }

    except Exception as error:
        print("Email Error:", error)

        raise HTTPException(
            status_code=500,
            detail="Unable to send message"
        )