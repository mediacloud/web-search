import threading
import logging
from django.core.mail import send_mail, EmailMessage, EmailMultiAlternatives
from django.template.loader import render_to_string
from django.template.loader import get_template
from django.template import Context

# mcweb
from settings import (
    ALERTS_RECIPIENTS,
    EMAIL_HOST,
    EMAIL_NOREPLY,
    EMAIL_ORGANIZATION
)

logger = logging.getLogger(__name__)

# adapted with help from https://github.com/CryceTruly/django-tutorial-youtube/tree/main/templates Cryce Truly


class EmailThread(threading.Thread):

    def __init__(self, email):
        self.email = email
        threading.Thread.__init__(self)

    def run(self):
        self.email.send()

def send_rescrape_email(subject: str, body: str, from_email: str, recipients: list[str]) -> int:
    """
    returns count of messages sent
    """
    logger.info(f"send_rescrape_email '%s' to %s", subject, ", ".join(recipients))
    logger.debug("body: %s", body)
    if not EMAIL_HOST:
        logger.info("no EMAIL_HOST")
        return 0

    try:
        n = send_mail(subject, body, from_email, recipients, fail_silently=False)
        logger.info("send_rescrape_email sent %d messages to %r", n, recipients)
        return n
    except Exception as e:
        logger.exception("send_rescrape_email")
    return -1

def send_signup_email(user, request):
    if not EMAIL_HOST:
        logger.info("send_signup_email: no EMAIL_HOST for %s", user)
        return

    email_body = render_to_string('authentication/activate.html', {'user': user})
    email = EmailMessage(subject=f'[{EMAIL_ORGANIZATION}] Thank you for signing up for {EMAIL_ORGANIZATION}',
                         body=email_body,
                         from_email=EMAIL_NOREPLY,
                         to=[user.email])
    try:
        EmailThread(email).start()
    except Exception as e:
        logger.exception("send_signup_email")


def send_source_upload_email(title: str, text: str, to: str):
    if not EMAIL_HOST:
        return
    send_mail(f"[{EMAIL_ORGANIZATION}] {title}", text, EMAIL_NOREPLY, [to], fail_silently=False)


# if 25k < count < 200k and user is not staff --> csv file will be emailed to user rather than downloaded
def send_zipped_large_download_email(zipped_filename, zipped_data, to: str):
    if not EMAIL_HOST:
        logger.debug("send_zipped_large_download_email: EMAIL_HOST not set for %s", to)
        return
    email = EmailMessage(subject=f"[{EMAIL_ORGANIZATION}] Downloaded Total Attention's Data",
                         body=zipped_filename,
                         from_email=EMAIL_NOREPLY, to=[to])
    try:
        email.attach(zipped_filename, zipped_data, 'application/zip')
        EmailThread(email).start()
    except Exception as e:
        logger.exception("send_zipped_large_download_email for %s", to)


def send_alert_email(alert_dict: dict):
    logger.info("send_alert_email %r", alert_dict)
    html_content = render_to_string('alerts/alert-system.html', {'alert_list': alert_dict})
    email_body_txt = html_content # PB: just have one line message?

    print(html_content)         # XXX TEMP

    # after rendering for testing
    if not EMAIL_HOST:
        logger.info("EMAIL_HOST not set")
        return

    msg = EmailMultiAlternatives(f'[{EMAIL_ORGANIZATION}] Alert System Email', email_body_txt, EMAIL_NOREPLY, ALERTS_RECIPIENTS)
    msg.attach_alternative(html_content, "text/html")
    try:
        msg.send()
    except Exception as e: 
        logger.exception("send_alert_email")
