"""
TechMart AI Support — WhatsApp Service (via Twilio)
"""

import logging
from ..config import settings

logger = logging.getLogger(__name__)


def is_whatsapp_configured() -> bool:
    """Check if WhatsApp/Twilio is configured."""

    return bool(
        settings.TWILIO_ACCOUNT_SID
        and settings.TWILIO_AUTH_TOKEN
        and settings.TWILIO_ACCOUNT_SID.startswith("AC")
    )


def send_whatsapp(to_number: str, message: str) -> bool:
    """
    Send a WhatsApp message via Twilio.
    to_number format: +91XXXXXXXXXX or +1XXXXXXXXXX
    """

    if not is_whatsapp_configured():

        logger.warning("WhatsApp not configured — skipping")

        return False

    try:

        from twilio.rest import Client

        client = Client(
            settings.TWILIO_ACCOUNT_SID,
            settings.TWILIO_AUTH_TOKEN,
        )

        # Format number for WhatsApp
        if not to_number.startswith("whatsapp:"):

            to_whatsapp = f"whatsapp:{to_number}"

        else:

            to_whatsapp = to_number

        msg = client.messages.create(
            from_=settings.TWILIO_WHATSAPP_FROM,
            to=to_whatsapp,
            body=message,
        )

        logger.info(f"WhatsApp sent to {to_number}: SID={msg.sid}")

        return True

    except Exception as e:

        logger.error(f"WhatsApp send failed: {e}")

        return False


def send_escalation_whatsapp(
    customer_name: str,
    customer_phone: str,
    reference: str,
) -> bool:
    """Send WhatsApp message when customer escalates to human agent."""

    message = (
        f"Hello {customer_name}! 👋\n\n"
        f"*TechMart Electronics Support*\n\n"
        f"Your case has been escalated to a human agent.\n\n"
        f"📋 *Reference:* {reference}\n"
        f"⏰ *Response Time:* Within 2 business hours\n\n"
        f"📞 Need immediate help?\n"
        f"Call: 1-800-TECHMART\n"
        f"Email: support@techmartelectronics.com\n\n"
        f"_TechMart AI Support System_"
    )

    return send_whatsapp(customer_phone, message)


def send_ticket_whatsapp(
    customer_name: str,
    customer_phone: str,
    ticket_number: str,
    priority: str,
) -> bool:
    """Send WhatsApp message when ticket is auto-created."""

    priority_emoji = (
        "🔴" if priority == "high" else "🟡" if priority == "medium" else "🟢"
    )

    message = (
        f"Hello {customer_name}! 👋\n\n"
        f"*TechMart Electronics Support*\n\n"
        f"A support ticket has been created for you.\n\n"
        f"🎫 *Ticket:* {ticket_number}\n"
        f"{priority_emoji} *Priority:* {priority.upper()}\n"
        f"📊 *Status:* OPEN\n\n"
        f"Our team will contact you soon!\n\n"
        f"📞 1-800-TECHMART\n"
        f"_TechMart AI Support System_"
    )

    return send_whatsapp(customer_phone, message)
