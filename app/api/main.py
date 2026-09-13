import os
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr

load_dotenv()

app = FastAPI(title="Ice Stream Contact API")
app.add_middleware(
    CORSMiddleware,
allow_origins=[
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


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

from app.api.endpoints import router as api_router

app.include_router(api_router, prefix="/api")