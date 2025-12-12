# app/services/email_service.py

import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List
import logging

from app.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    """Service for sending emails using SMTP."""
    
    @staticmethod
    async def send_email(
        to_email: str,
        subject: str,
        html_content: str,
        text_content: str = None
    ) -> bool:
        """
        Send an email using configured SMTP settings.
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            html_content: HTML content of the email
            text_content: Plain text content (optional, will use html if not provided)
        
        Returns:
            bool: True if email sent successfully, False otherwise
        """
        # Check if email is configured
        if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
            logger.warning("Email not configured. Skipping email send.")
            logger.info(f"Would send email to {to_email}: {subject}")
            return False
        
        try:
            # Create message
            message = MIMEMultipart("alternative")
            message["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL or settings.SMTP_USER}>"
            message["To"] = to_email
            message["Subject"] = subject
            
            # Add plain text part
            if text_content:
                part1 = MIMEText(text_content, "plain")
                message.attach(part1)
            
            # Add HTML part
            part2 = MIMEText(html_content, "html")
            message.attach(part2)
            
            # Send email
            await aiosmtplib.send(
                message,
                hostname=settings.SMTP_HOST,
                port=settings.SMTP_PORT,
                username=settings.SMTP_USER,
                password=settings.SMTP_PASSWORD,
                start_tls=True,
            )
            
            logger.info(f"Email sent successfully to {to_email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {str(e)}")
            return False
    
    @staticmethod
    def create_verification_email(
        user_email: str,
        user_name: str,
        verification_token: str
    ) -> tuple[str, str]:
        """
        Create verification email content.
        
        Args:
            user_email: User's email address
            user_name: User's first name
            verification_token: Verification token
        
        Returns:
            tuple: (subject, html_content)
        """
        verification_link = f"{settings.BASE_URL}/verify-email?token={verification_token}"
        
        subject = "Verify Your PetWell Account"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }}
                .container {{
                    background-color: #f9f9f9;
                    border-radius: 10px;
                    padding: 30px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }}
                .header {{
                    text-align: center;
                    margin-bottom: 30px;
                }}
                .logo {{
                    font-size: 32px;
                    color: #8b5cf6;
                    font-weight: bold;
                }}
                .paw {{
                    font-size: 40px;
                }}
                h1 {{
                    color: #8b5cf6;
                    font-size: 24px;
                    margin-bottom: 20px;
                }}
                .button {{
                    display: inline-block;
                    padding: 15px 30px;
                    background-color: #8b5cf6;
                    color: white;
                    text-decoration: none;
                    border-radius: 5px;
                    font-weight: bold;
                    margin: 20px 0;
                }}
                .button:hover {{
                    background-color: #7c3aed;
                }}
                .footer {{
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #ddd;
                    font-size: 12px;
                    color: #666;
                    text-align: center;
                }}
                .link {{
                    color: #8b5cf6;
                    word-break: break-all;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="paw">🐾</div>
                    <div class="logo">PetWell</div>
                </div>
                
                <h1>Welcome to PetWell, {user_name}!</h1>
                
                <p>Thank you for registering with PetWell, your AI-powered pet care management platform.</p>
                
                <p>To complete your registration and start managing your pets' health, please verify your email address by clicking the button below:</p>
                
                <div style="text-align: center;">
                    <a href="{verification_link}" class="button">Verify Email Address</a>
                </div>
                
                <p>Or copy and paste this link into your browser:</p>
                <p class="link">{verification_link}</p>
                
                <p><strong>This link will expire in 24 hours.</strong></p>
                
                <p>If you didn't create an account with PetWell, you can safely ignore this email.</p>
                
                <div class="footer">
                    <p>© 2025 PetWell. All rights reserved.</p>
                    <p>This is an automated email, please do not reply.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return subject, html_content
    
    @staticmethod
    async def send_verification_email(
        user_email: str,
        user_name: str,
        verification_token: str
    ) -> bool:
        """
        Send verification email to user.
        
        Args:
            user_email: User's email address
            user_name: User's first name
            verification_token: Verification token
        
        Returns:
            bool: True if email sent successfully, False otherwise
        """
        subject, html_content = EmailService.create_verification_email(
            user_email, user_name, verification_token
        )
        
        return await EmailService.send_email(
            to_email=user_email,
            subject=subject,
            html_content=html_content
        )
