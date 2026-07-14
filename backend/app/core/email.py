import smtplib
import asyncio
from email.message import EmailMessage
from app.core.config import settings

def _send_email_sync(to_email: str, subject: str, body: str):
    msg = EmailMessage()
    msg.set_content(body)
    msg['Subject'] = subject
    msg['From'] = settings.SMTP_USER
    msg['To'] = to_email

    server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
    server.starttls()
    server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
    server.send_message(msg)
    server.quit()

async def send_password_reset_email(to_email: str, token: str):
    link = f"http://localhost:5173/reset-password?token={token}"
    
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        print(f"\n[AVISO] SMTP no configurado en .env.")
        print(f"[{to_email}] RECUPERACIÓN DE CONTRASEÑA SIMULADA:")
        print(link, "\n")
        return

    subject = "Recuperación de Contraseña - E-Sports Hub"
    body = f"Has solicitado restablecer tu contraseña.\n\nHaz click aqui para cambiar tu contrasena: {link}\n\nSi no fuiste tú, ignora este correo."
    
    try:
        await asyncio.to_thread(_send_email_sync, to_email, subject, body)
    except Exception as e:
        print(f"Error enviando correo a {to_email}: {e}")
