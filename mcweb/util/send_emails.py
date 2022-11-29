from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str, DjangoUnicodeDecodeError
from django.contrib.sites.shortcuts import get_current_site
from util.token_generator import generate_token

def send_email(mail_params):
    subject, body, from_email, recepient = mail_params
    print(mail_params)
    try:
        send_mail(subject, body, from_email, [recepient], fail_silently=False)
    except Exception as e: 
        print(e)

def send_signup_email(recepient_email, request):
    current_site = get_current_site
    email_body = render_to_string('authentication/activate.html', {
        'user': request.user,
        'domain': current_site,
        'uid': urlsafe_base64_encode(force_bytes(request.user.pk)),
        'token': generate_token.make_token(request.user)
    })
    try: 
        send_mail('[Media Cloud] Activate your Media Cloud account',
                email_body,
                'noreply@mediacloud.org',
                [recepient_email],
                fail_silently=False )
    except Exception as e:
        print(e)

def send_source_upload_email(mail_params):
    subject, body, recepient = mail_params 
    try:
        send_mail(subject, body, 'system@mediacloud.org', [recepient], fail_silently=False)
    except Exception as e:
        print(e)