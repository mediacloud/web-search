import threading
import logging
from django.core.mail import send_mail, EmailMessage
from django.template.loader import render_to_string
from django.core.mail import EmailMultiAlternatives
from django.template.loader import get_template
from django.template import Context
from settings import EMAIL_HOST


logger = logging.getLogger(__name__)

# adapted with help from https://github.com/CryceTruly/django-tutorial-youtube/tree/main/templates Cryce Truly


class EmailThread(threading.Thread):

    def __init__(self, email):
        self.email = email
        threading.Thread.__init__(self)

    def run(self):
        self.email.send()


def send_email(mail_params):
    if not EMAIL_HOST:
        return
    subject, body, from_email, recepient = mail_params
    print(mail_params)
    try:
        send_mail(subject, body, from_email, [recepient], fail_silently=False)
    except Exception as e:
        logger.exception(e)


def send_signup_email(user, request):
    if not EMAIL_HOST:
        return
    email_body = render_to_string('authentication/activate.html', {
        'user': user,
    })
    email = EmailMessage(subject='[Media Cloud] Thank you for signing up for Media Cloud',
                         body=email_body,
                         from_email='noreply@mediacloud.org',
                         to=[user.email])
    try:
        EmailThread(email).start()
    except Exception as e:
        print(e)


def send_source_upload_email(title: str, text: str, to: str):
    if not EMAIL_HOST:
        return
    send_mail(title, text, 'system@mediacloud.org', [to], fail_silently=False)


# if 25k < count < 200k and user is not staff --> csv file will be emailed to user rather than downloaded
def send_zipped_large_download_email(zipped_filename, zipped_data, to):
    if not EMAIL_HOST:
        return
    email = EmailMessage(subject="Downloaded Total Attention's Data",
                         from_email='noreply@mediacloud.org', to=[to])
    try:
        email.attach(zipped_filename, zipped_data, 'application/zip')
        EmailThread(email).start()
    except Exception as e:
        logger.exception(e)


def send_alert_email(alert_dict: dict):
    if not EMAIL_HOST:
        return
   
    print(alert_dict, "INEMAIL")
    html_content = render_to_string('alerts/alert-system.html', {'alert_list': alert_dict})

    email_body_txt = render_to_string('alerts/alert-system.html', {
        'alert_list': alert_dict,
    })
    to = ['e.leon@northeastern.edu']
    # to=['e.leon@northeastern.edu', 
    #     'rebecca@mediacloud.org', 
    #     'ebndulue@mediacloud.org', 
    #     'fernando@mediacloud.org',
    #     'frimpomaa@mediacloud.org']
    msg = EmailMultiAlternatives('[Media Cloud] Alert System Email', email_body_txt, 'noreply@mediacloud.org', to)
    msg.attach_alternative(html_content, "text/html")
    try:
        msg.send()
    except Exception as e: 
        logger.exception(e)
    # email = EmailMultiAlternatives(subject='[Media Cloud] Alert System Email',
    #                      body=email_body,
    #                      from_email='noreply@mediacloud.org',
    #                      to=['e.leon@northeastern.edu', 
    #                         'rebecca@mediacloud.org', 
    #                         'ebndulue@mediacloud.org', 
    #                         'fernando@mediacloud.org',
    #                         'frimpomaa@mediacloud.org'])
    # try: 
    #     EmailThread(msg).start()
    # except Exception as e:
    #     print(e)
    # try:
    #     send_mail('Stories per week', 
    #               msg,'system@mediacloud.org', 
    #               ['e.leon@northeastern.edu', 
    #                'rebecca@mediacloud.org', 
    #                'ebndulue@mediacloud.org', 
    #                'fernando@mediacloud.org',
    #                'frimpomaa@mediacloud.org'], 
    #               fail_silently=False)
    # except Exception as e: 
    #     logger.exception(e)
