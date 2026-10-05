"""
Email Service for ParyavaranSanrakshan.
Sends styled HTML emails for OTP verification and admin login.
Uses Gmail SMTP with App Password.
"""

import re
import smtplib
import random
import string
import threading
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
from backend.app.config import settings

LOGO_IMAGE_URL = "https://res.cloudinary.com/ntpvcbfk/image/upload/v1791131813/paryavaran_sanrakshan/brand/scan_b4e687837c0d.png"


def format_email_rich_content(text: str) -> str:
    """Converts markdown / rich text into properly styled HTML for email clients (bold, italic, underline, lists)."""
    if not text:
        return ""
    
    lines = text.replace('\r\n', '\n').split('\n')
    html_lines = []
    in_ul = False
    in_ol = False

    for line in lines:
        stripped = line.strip()
        
        if stripped.startswith('### '):
            if in_ul: html_lines.append("</ul>"); in_ul = False
            if in_ol: html_lines.append("</ol>"); in_ol = False
            html_lines.append(f'<h3 style="margin: 20px 0 8px 0; font-size: 16px; font-weight: 700; color: #12372A;">{stripped[4:]}</h3>')
            continue
        elif stripped.startswith('## '):
            if in_ul: html_lines.append("</ul>"); in_ul = False
            if in_ol: html_lines.append("</ol>"); in_ol = False
            html_lines.append(f'<h2 style="margin: 22px 0 10px 0; font-size: 18px; font-weight: 800; color: #12372A;">{stripped[3:]}</h2>')
            continue
        elif stripped.startswith('# '):
            if in_ul: html_lines.append("</ul>"); in_ul = False
            if in_ol: html_lines.append("</ol>"); in_ol = False
            html_lines.append(f'<h1 style="margin: 24px 0 12px 0; font-size: 20px; font-weight: 800; color: #12372A;">{stripped[2:]}</h1>')
            continue

        if stripped.startswith('- ') or stripped.startswith('* '):
            if in_ol: html_lines.append("</ol>"); in_ol = False
            if not in_ul:
                html_lines.append('<ul style="margin: 8px 0 14px 20px; padding: 0; color: #334155; line-height: 1.6;">')
                in_ul = True
            html_lines.append(f'<li style="margin-bottom: 6px;">{stripped[2:]}</li>')
            continue
            
        num_match = re.match(r'^\d+\.\s+(.*)$', stripped)
        if num_match:
            if in_ul: html_lines.append("</ul>"); in_ul = False
            if not in_ol:
                html_lines.append('<ol style="margin: 8px 0 14px 20px; padding: 0; color: #334155; line-height: 1.6;">')
                in_ol = True
            html_lines.append(f'<li style="margin-bottom: 6px;">{num_match.group(1)}</li>')
            continue

        if not stripped:
            if in_ul: html_lines.append("</ul>"); in_ul = False
            if in_ol: html_lines.append("</ol>"); in_ol = False
            html_lines.append('<br />')
            continue

        if in_ul: html_lines.append("</ul>"); in_ul = False
        if in_ol: html_lines.append("</ol>"); in_ol = False
        html_lines.append(f'<p style="margin: 0 0 12px 0; line-height: 1.7; color: #334155;">{line}</p>')

    if in_ul: html_lines.append("</ul>")
    if in_ol: html_lines.append("</ol>")

    full_html = "\n".join(html_lines)
    full_html = re.sub(r'\*\*(.+?)\*\*', r'<strong style="font-weight: 700; color: #0f172a;">\1</strong>', full_html)
    full_html = re.sub(r'__(.+?)__', r'<strong style="font-weight: 700; color: #0f172a;">\1</strong>', full_html)
    full_html = re.sub(r'(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)', r'<em style="font-style: italic;">\1</em>', full_html)
    full_html = re.sub(r'(?<!_)_(?!_)(.+?)(?<!_)_(?!_)', r'<em style="font-style: italic;">\1</em>', full_html)
    full_html = re.sub(r'<u>(.+?)</u>', r'<u style="text-decoration: underline;">\1</u>', full_html, flags=re.IGNORECASE)
    full_html = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'<a href="\2" style="color: #047857; text-decoration: underline; font-weight: 600;">\1</a>', full_html)

    return full_html


def _dispatch_smtp_background(msg: MIMEMultipart, to_email: str):
    """Sends email via SMTP in a background thread to prevent blocking HTTP endpoints."""
    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_FROM_EMAIL, to_email, msg.as_string())
        print(f"[EMAIL SUCCESS] Live email dispatched asynchronously to {to_email}")
    except Exception as e:
        print(f"[EMAIL ERROR] Background SMTP dispatch to {to_email} failed: {e}")


def generate_otp(length: int = 6) -> str:
    """Generate a numeric OTP of given length."""
    return ''.join(random.choices(string.digits, k=length))


def get_email_template(otp_code: str, purpose: str, user_name: str = "User") -> str:
    """Generate a stylish HTML email template with the official ParyavaranSanrakshan logo."""
    
    if purpose == "ADMIN_LOGIN":
        heading = "Admin Login Verification"
        badge_text = "SECURE 2-FACTOR AUTH"
        message = "You are attempting to sign in to the <strong>Administrator Command Portal</strong>. Please enter the one-time security passkey below to complete your authentication."
        footer_note = "This verification code is strictly confidential and expires in 10 minutes. If you did not initiate this login attempt, please secure your account immediately."
    elif purpose == "REGISTER_VERIFY":
        heading = "Verify Your Email Address"
        badge_text = "WELCOME TO PARYAVARAN"
        message = f"Welcome to ParyavaranSanrakshan, <strong>{user_name}</strong>! We are delighted to have you join our green mission. Please enter the OTP below to verify your email address."
        footer_note = "This OTP is valid for 10 minutes. Once verified, you will have immediate access to your portal."
    elif purpose == "PASSWORD_RESET":
        heading = "Reset Your Password"
        badge_text = "PASSWORD RECOVERY"
        message = f"Hello <strong>{user_name}</strong>, we received a request to reset your ParyavaranSanrakshan account password. Please enter the one-time passcode below to set a new password."
        footer_note = "This OTP is valid for 10 minutes. If you did not request a password reset, please ignore this email."
    else:
        heading = "Verification Code"
        badge_text = "PARYAVARANSANRAKSHAN"
        message = f"Here is your one-time verification passcode for ParyavaranSanrakshan."
        footer_note = "This OTP is valid for 10 minutes. Please do not share it with anyone."

    html = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{heading}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f1f5f2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f1f5f2; padding: 40px 15px;">
            <tr>
                <td align="center">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="560" style="max-width: 560px; width: 100%; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 12px 35px rgba(20, 83, 45, 0.08); border: 1px solid #e2ece4;">
                        
                        <!-- TOP LOGO BRANDING HEADER -->
                        <tr>
                            <td align="center" style="padding: 36px 30px 28px 30px; background: linear-gradient(135deg, #12372A 0%, #1b4332 50%, #2d6a4f 100%);">
                                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                    <tr>
                                        <td align="center">
                                            <!-- Official Project Logo (Direct, No Card/Frame) -->
                                            <img src="{LOGO_IMAGE_URL}" alt="ParyavaranSanrakshan Logo" height="74" style="display: block; margin: 0 auto; height: 74px; max-height: 74px; width: auto; object-fit: contain;" />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td align="center" style="padding-top: 14px;">
                                            <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                                                Paryavaran<span style="color: #6ee7b7;">Sanrakshan</span>
                                            </h1>
                                            <p style="margin: 6px 0 0 0; font-size: 11px; color: #a7f3d0; text-transform: uppercase; letter-spacing: 2.5px; font-weight: 600;">
                                                AI Smart Waste & Conservation Platform
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>

                        <!-- MOTHER EARTH SANSKRIT MOTTO BAR -->
                        <tr>
                            <td align="center" style="background-color: #f7faf7; padding: 12px 24px; border-bottom: 1px solid #e8efe9;">
                                <span style="font-size: 13px; font-weight: 700; color: #b45309; letter-spacing: 0.5px;">
                                    || माता भूमि: पुत्रों अहम् पृथिव्या: ||
                                </span>
                            </td>
                        </tr>

                        <!-- MAIN BODY CONTENT -->
                        <tr>
                            <td style="padding: 38px 42px 30px 42px;">
                                <div style="display: inline-block; padding: 4px 12px; background-color: #ecfdf5; border-radius: 999px; border: 1px solid #a7f3d0; margin-bottom: 16px;">
                                    <span style="font-size: 11px; font-weight: 700; color: #065f46; letter-spacing: 1px; text-transform: uppercase;">
                                        {badge_text}
                                    </span>
                                </div>
                                <h2 style="margin: 0 0 14px 0; font-size: 22px; font-weight: 700; color: #1e293b;">
                                    {heading}
                                </h2>
                                <p style="margin: 0 0 28px 0; font-size: 15px; color: #475569; line-height: 1.65;">
                                    {message}
                                </p>

                                <!-- PASSCODE BOX -->
                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                    <tr>
                                        <td align="center" style="padding: 10px 0 24px 0;">
                                            <div style="background: #f0fdf4; border-radius: 18px; padding: 22px 36px; display: inline-block; border: 2px dashed #10b981; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.08);">
                                                <span style="font-size: 38px; font-weight: 800; color: #065f46; letter-spacing: 12px; font-family: 'Courier New', monospace; display: block; margin-left: 12px;">
                                                    {otp_code}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                </table>

                                <div style="background-color: #f8fafc; border-radius: 12px; padding: 14px 18px; border-left: 4px solid #10b981;">
                                    <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.6;">
                                        ⏱️ <strong>Validity:</strong> {footer_note}
                                    </p>
                                </div>
                            </td>
                        </tr>

                        <!-- FOOTER -->
                        <tr>
                            <td align="center" style="background-color: #f8faf9; padding: 24px 40px; border-top: 1px solid #e8eee9;">
                                <p style="margin: 0; font-size: 13px; color: #475569; font-style: italic;">
                                    "Caring for the earth, as one cares for a mother."
                                </p>
                                <p style="margin: 6px 0 0 0; font-size: 11px; color: #94a3b8;">
                                    © 2026 ParyavaranSanrakshan. All rights reserved.
                                </p>
                            </td>
                        </tr>

                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """
    return html


def send_otp_email(to_email: str, otp_code: str, purpose: str, user_name: str = "User") -> bool:
    """Send OTP email via Gmail SMTP asynchronously."""
    print("\n" + "=" * 65)
    print(f"[OTP DISPATCH] RECIPIENT: {to_email}")
    print(f"               PURPOSE:   {purpose}")
    print(f"               OTP CODE:  {otp_code} (Valid for {settings.OTP_EXPIRE_MINUTES} min)")
    print("=" * 65 + "\n")

    if not settings.SMTP_PASSWORD:
        print(f"[NOTE] SMTP_PASSWORD not set in .env. Enter Google App Password to enable live SMTP delivery.")
        return True

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"ParyavaranSanrakshan Verification Code: {otp_code}"
        msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
        msg["To"] = to_email

        # Plain text fallback
        text_content = f"""
ParyavaranSanrakshan — Verification Code

Your OTP: {otp_code}

This code is valid for {settings.OTP_EXPIRE_MINUTES} minutes.
If you did not request this, please ignore this email.

|| माता भूमि: पुत्रों अहम् पृथिव्या: ||
"Caring for the earth, as one cares for a mother."
"""
        html_content = get_email_template(otp_code, purpose, user_name)

        msg.attach(MIMEText(text_content, "plain", "utf-8"))
        msg.attach(MIMEText(html_content, "html", "utf-8"))

        # Dispatch in background thread for instant response
        threading.Thread(target=_dispatch_smtp_background, args=(msg, to_email), daemon=True).start()
        return True

    except Exception as e:
        print(f"[EMAIL ERROR] Failed live SMTP dispatch setup for {to_email}: {e}")
        return False


def send_event_registration_email(
    to_email: str,
    user_name: str,
    event_title: str,
    event_date: str,
    event_location: str,
    category: str = "Environmental Drive"
) -> bool:
    """Send stylish Event Registration confirmation email from info.karuneshtiwari@gmail.com."""
    print("\n" + "=" * 65)
    print(f"[EVENT CONFIRMATION] SENDER: {settings.SMTP_FROM_EMAIL}")
    print(f"                    RECIPIENT: {to_email}")
    print(f"                    EVENT:     {event_title}")
    print(f"                    DATE:      {event_date}")
    print(f"                    LOCATION:  {event_location}")
    print("=" * 65 + "\n")

    if not settings.SMTP_PASSWORD:
        print("[NOTE] SMTP_PASSWORD not set in .env. Live email simulated in console logs.")
        return True

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"Confirmed: You are registered for {event_title} | ParyavaranSanrakshan"
        msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
        msg["To"] = to_email

        text_content = f"""
Hello {user_name},

Congratulations! You have successfully registered for:
{event_title}

Event Details:
- Category: {category}
- Date & Time: {event_date}
- Location: {event_location}

Thank you for being an active eco-citizen!
|| माता भूमि: पुत्रों अहम् पृथिव्या: ||
ParyavaranSanrakshan Team
"""

        html_content = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Event Registration Confirmed</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f1f5f2; padding: 40px 15px;">
        <tr>
            <td align="center">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="560" style="max-width: 560px; width: 100%; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 12px 35px rgba(20, 83, 45, 0.08); border: 1px solid #e2ece4;">
                    
                    <!-- BRANDING HEADER WITH LOGO -->
                    <tr>
                        <td align="center" style="padding: 36px 30px 28px 30px; background: linear-gradient(135deg, #12372A 0%, #1b4332 50%, #2d6a4f 100%);">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                    <td align="center">
                                        <img src="{LOGO_IMAGE_URL}" alt="ParyavaranSanrakshan Logo" height="74" style="display: block; margin: 0 auto; height: 74px; max-height: 74px; width: auto; object-fit: contain;" />
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center" style="padding-top: 14px;">
                                        <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                                            Paryavaran<span style="color: #6ee7b7;">Sanrakshan</span>
                                        </h1>
                                        <p style="margin: 6px 0 0 0; font-size: 11px; color: #a7f3d0; text-transform: uppercase; letter-spacing: 2.5px; font-weight: 600;">
                                            Citizen Eco-Initiative & Smart Waste Platform
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- MOTHER EARTH MOTTO BAR -->
                    <tr>
                        <td align="center" style="background-color: #f7faf7; padding: 12px 24px; border-bottom: 1px solid #e8efe9;">
                            <span style="font-size: 13px; font-weight: 700; color: #b45309; letter-spacing: 0.5px;">
                                || माता भूमि: पुत्रों अहम् पृथिव्या: ||
                            </span>
                        </td>
                    </tr>

                    <!-- CONTENT -->
                    <tr>
                        <td style="padding: 38px 42px 30px 42px;">
                            <div style="display: inline-block; padding: 4px 14px; background-color: #ecfdf5; border-radius: 999px; border: 1px solid #a7f3d0; margin-bottom: 16px;">
                                <span style="font-size: 11px; font-weight: 700; color: #065f46; letter-spacing: 1px; text-transform: uppercase;">
                                    REGISTRATION CONFIRMED
                                </span>
                            </div>
                            
                            <h2 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 700; color: #1e293b;">
                                You're on the list, {user_name}!
                            </h2>
                            <p style="margin: 0 0 24px 0; font-size: 15px; color: #475569; line-height: 1.6;">
                                Thank you for taking action for a cleaner, greener community. Your registration has been confirmed for the upcoming initiative:
                            </p>

                            <!-- EVENT PASS CARD -->
                            <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 16px; padding: 22px; margin-bottom: 24px;">
                                <h3 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 800; color: #14532d;">
                                    {event_title}
                                </h3>
                                
                                <table role="presentation" cellspacing="0" cellpadding="4" border="0" width="100%" style="font-size: 13px; color: #166534;">
                                    <tr>
                                        <td width="100" style="vertical-align: top;"><strong>Date & Time:</strong></td>
                                        <td>{event_date}</td>
                                    </tr>
                                    <tr>
                                        <td width="100" style="vertical-align: top;"><strong>Location:</strong></td>
                                        <td>{event_location}</td>
                                    </tr>
                                    <tr>
                                        <td width="100" style="vertical-align: top;"><strong>Category:</strong></td>
                                        <td>{category}</td>
                                    </tr>
                                </table>
                            </div>

                            <p style="margin: 0 0 10px 0; font-size: 13px; color: #64748b; line-height: 1.6;">
                                Please carry this email confirmation or show your profile on the ParyavaranSanrakshan portal upon arrival at the venue.
                            </p>
                        </td>
                    </tr>

                    <!-- FOOTER -->
                    <tr>
                        <td align="center" style="background-color: #f8faf9; padding: 24px 40px; border-top: 1px solid #e8eee9;">
                            <p style="margin: 0; font-size: 13px; color: #475569; font-style: italic;">
                                "Caring for the earth, as one cares for a mother."
                            </p>
                            <p style="margin: 6px 0 0 0; font-size: 11px; color: #94a3b8;">
                                © 2026 ParyavaranSanrakshan • Bengaluru Metropolitan Eco-Action
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
"""
        msg.attach(MIMEText(text_content, "plain", "utf-8"))
        msg.attach(MIMEText(html_content, "html", "utf-8"))

        threading.Thread(target=_dispatch_smtp_background, args=(msg, to_email), daemon=True).start()
        return True
        return True

    except Exception as e:
        print(f"[EVENT EMAIL ERROR] Failed to send registration email to {to_email}: {e}")
        return False


def send_contact_notification_email(sender_name: str, sender_email: str, subject: str, message_text: str) -> bool:
    """
    Sends an immediate email notification to administrator (info.karuneshtiwari@gmail.com)
    when a citizen or partner submits a message via the Contact Form.
    """
    admin_recipient = "info.karuneshtiwari@gmail.com"
    if not settings.SMTP_PASSWORD:
        print(f"[CONTACT FORM NOTICE] SMTP_PASSWORD not configured. Message recorded: {sender_name} <{sender_email}>")
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"🌱 [Paryavaran Contact] {subject} - from {sender_name}"
        msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
        msg["To"] = admin_recipient
        msg["Reply-To"] = sender_email

        plain_text = f"New Contact Message Received\n\nName: {sender_name}\nEmail: {sender_email}\nSubject: {subject}\n\nMessage:\n{message_text}\n"

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>New Contact Message</title>
        </head>
        <body style="margin:0; padding:20px; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color:#f4f7f5;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                    <td align="center">
                        <table role="presentation" width="560" style="max-width:560px; background:#ffffff; border-radius:18px; overflow:hidden; border:1px solid #d1e2d7; box-shadow:0 10px 25px rgba(0,0,0,0.06);">
                            <tr style="background:#1b4332;">
                                <td style="padding:28px 32px 20px 32px; text-align:center;">
                                    <img src="{LOGO_IMAGE_URL}" alt="ParyavaranSanrakshan Logo" height="68" style="display: block; margin: 0 auto 12px auto; height: 68px; max-height: 68px; width: auto; object-fit: contain;" />
                                    <h2 style="margin:0; color:#ffffff; font-size:20px; font-weight:700;">🌱 New Citizen Message Received</h2>
                                    <p style="margin:6px 0 0 0; color:#a7f3d0; font-size:12px;">ParyavaranSanrakshan Contact Portal</p>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding:32px;">
                                    <p style="margin:0 0 16px 0; font-size:14px; color:#475569;">You have received a new inquiry through the website contact form:</p>
                                    
                                    <table width="100%" style="border-collapse:collapse; margin-bottom:20px;">
                                        <tr>
                                            <td style="padding:8px 0; font-weight:600; font-size:13px; color:#1e293b; width:100px;">Sender:</td>
                                            <td style="padding:8px 0; font-size:13px; color:#334155;">{sender_name}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding:8px 0; font-weight:600; font-size:13px; color:#1e293b;">Email:</td>
                                            <td style="padding:8px 0; font-size:13px; color:#0d9488;"><a href="mailto:{sender_email}" style="color:#0d9488; text-decoration:none;">{sender_email}</a></td>
                                        </tr>
                                        <tr>
                                            <td style="padding:8px 0; font-weight:600; font-size:13px; color:#1e293b;">Subject:</td>
                                            <td style="padding:8px 0; font-size:13px; color:#334155; font-weight:600;">{subject}</td>
                                        </tr>
                                    </table>

                                    <div style="background:#f8faf9; border-left:4px solid #1b4332; padding:16px; border-radius:8px; font-size:14px; line-height:1.6; color:#1e293b; white-space:pre-wrap;">{message_text}</div>

                                    <div style="margin-top:24px; text-align:center;">
                                        <a href="mailto:{sender_email}?subject=Re: {subject}" style="display:inline-block; padding:10px 24px; background:#1b4332; color:#ffffff; text-decoration:none; font-weight:600; border-radius:24px; font-size:13px;">Reply to {sender_name}</a>
                                    </div>
                                </td>
                            </tr>
                            <tr style="background:#f1f5f2; border-top:1px solid #e2ece4;">
                                <td style="padding:16px; text-align:center; font-size:11px; color:#64748b;">
                                    © 2026 ParyavaranSanrakshan • Automated Dispatch to {admin_recipient}
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        """

        msg.attach(MIMEText(plain_text, "plain", "utf-8"))
        msg.attach(MIMEText(html_content, "html", "utf-8"))

        threading.Thread(target=_dispatch_smtp_background, args=(msg, admin_recipient), daemon=True).start()
        print(f"[CONTACT EMAIL SUCCESS] Notification dispatched asynchronously to {admin_recipient}")
        return True
    except Exception as e:
        print(f"[CONTACT EMAIL ERROR] Failed to dispatch contact email to {admin_recipient}: {e}")
        return False


def send_bulk_broadcast_email(
    recipients: list,
    subject: str,
    heading: str,
    content: str,
    badge_text: str = "OFFICIAL UPDATE",
    cta_text: str = None,
    cta_url: str = None,
    template_type: str = "custom"
):
    """
    Dispatches styled bulk broadcast emails to users, collectors, newsletter subscribers, and donors.
    """
    def _worker():
        if not recipients:
            return

        # Prepare CTA button if provided
        button_html = ""
        if cta_text and cta_url:
            button_html = f"""
            <div style="margin-top: 28px; text-align: center;">
                <a href="{cta_url}" target="_blank" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #12372A 0%, #1b4332 100%); color: #ffffff; text-decoration: none; font-weight: 700; border-radius: 9999px; font-size: 14px; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(18, 55, 42, 0.3);">
                    {cta_text}
                </a>
            </div>
            """

        badge_bg = "#ecfdf5"
        badge_color = "#047857"
        badge_border = "#a7f3d0"

        if template_type == "event_enrolled":
            badge_text_final = badge_text or "✓ EVENT REGISTRATION CONFIRMED"
            badge_bg = "#f0fdf4"
            badge_color = "#15803d"
            badge_border = "#86efac"
        elif template_type == "article_read":
            badge_text_final = badge_text or "FEATURED ECO PUBLICATION"
            badge_bg = "#ecfeff"
            badge_color = "#0e7490"
            badge_border = "#a5f3fc"
        else:
            badge_text_final = badge_text or "PARYAVARAN OFFICIAL BULLETIN"

        html_body = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>{subject}</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f1f5f2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f1f5f2; padding: 40px 15px;">
                <tr>
                    <td align="center">
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="580" style="max-width: 580px; width: 100%; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 12px 35px rgba(20, 83, 45, 0.08); border: 1px solid #e2ece4;">
                            
                            <!-- BRAND HEADER -->
                            <tr>
                                <td align="center" style="padding: 36px 30px 28px 30px; background: linear-gradient(135deg, #12372A 0%, #1b4332 50%, #2d6a4f 100%);">
                                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                        <tr>
                                            <td align="center">
                                                <img src="{LOGO_IMAGE_URL}" alt="Logo" height="74" style="display: block; margin: 0 auto; height: 74px; max-height: 74px; width: auto; object-fit: contain;" />
                                            </td>
                                        </tr>
                                        <tr>
                                            <td align="center" style="padding-top: 14px;">
                                                <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                                                    Paryavaran<span style="color: #6ee7b7;">Sanrakshan</span>
                                                </h1>
                                                <p style="margin: 6px 0 0 0; font-size: 11px; color: #a7f3d0; text-transform: uppercase; letter-spacing: 2.5px; font-weight: 600;">
                                                    Empowering Sustainable Communities
                                                </p>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>

                            <!-- MAIN CONTENT -->
                            <tr>
                                <td style="padding: 36px 36px 28px 36px;">
                                    <div style="text-align: center; margin-bottom: 20px;">
                                        <span style="display: inline-block; padding: 6px 16px; background-color: {badge_bg}; color: {badge_color}; border: 1px solid {badge_border}; border-radius: 9999px; font-size: 11px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase;">
                                            {badge_text_final}
                                        </span>
                                    </div>

                                    <h2 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 800; color: #12372A; text-align: center; line-height: 1.3;">
                                        {heading}
                                    </h2>

                                    <div style="font-size: 15px; line-height: 1.7; color: #334155; margin: 20px 0;">
                                        {format_email_rich_content(content)}
                                    </div>

                                    {button_html}
                                </td>
                            </tr>

                            <!-- FOOTER & UNSUBSCRIBE -->
                            <tr>
                                <td style="padding: 24px 30px; background-color: #f8faf9; border-top: 1px solid #eef2ef; text-align: center;">
                                    <p style="margin: 0 0 8px 0; font-size: 12px; color: #64748b;">
                                        You are receiving this official communication as a registered participant, collector, donor, or subscriber of ParyavaranSanrakshan.
                                    </p>
                                    <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                                        © 2026 ParyavaranSanrakshan. All rights reserved. • To unsubscribe from community emails, contact support or toggle preferences in your profile.
                                    </p>
                                </td>
                            </tr>

                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        """

        try:
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=25) as server:
                server.ehlo()
                server.starttls()
                server.ehlo()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                for recipient in recipients:
                    try:
                        msg = MIMEMultipart("alternative")
                        msg["Subject"] = subject
                        msg["From"] = f"ParyavaranSanrakshan <{settings.SMTP_FROM_EMAIL}>"
                        msg["To"] = recipient
                        msg.attach(MIMEText(content, "plain", "utf-8"))
                        msg.attach(MIMEText(html_body, "html", "utf-8"))
                        server.sendmail(settings.SMTP_FROM_EMAIL, recipient, msg.as_string())
                        print(f"[BULK EMAIL] Sent broadcast to: {recipient}")
                    except Exception as err:
                        print(f"[BULK EMAIL ERROR] Failed to send to {recipient}: {err}")
        except Exception as e:
            print(f"[BULK SMTP ERROR] Connection failed: {e}")

    threading.Thread(target=_worker, daemon=True).start()
    return True


