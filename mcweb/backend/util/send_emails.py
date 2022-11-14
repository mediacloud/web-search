from django.core.mail import send_mail

def send_email(mail_params):
    subject, body, from_email, recepient = mail_params
    send_mail(
        subject,
        body,
        from_email,
        [recepient]
    )