from django.core.mail import send_mail

def send_email(mail_params):
    subject, body, from_email, recepient = mail_params
    print(mail_params)
    try:
        send_mail(subject, body, from_email, [recepient], fail_silently=False)
    except Exception as e: 
        print(e)

def send_signup_email(recepient):
    try: 
        send_email('[Media Cloud] Activate your Media Cloud account',
                'Thanks for registering',
                'noreply@mediacloud.org',
                [recepient],
                fail_silently=False )
    except Exception as e:
        print(e)
