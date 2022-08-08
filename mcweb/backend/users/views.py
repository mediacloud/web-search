from pickle import FALSE
import string
import random
import json
import logging
from django.http import HttpResponse
from django.views.decorators.http import require_http_methods
from django.contrib.auth.models import auth, User
from django.core import serializers
import humps


from django.core.mail import send_mail
import settings

import datetime as dt

logger = logging.getLogger(__name__)


# random key generator
def randomKeyGenerator():
    return ''.join(random.choice(string.ascii_uppercase + string.digits) for i in range(8))


# does the email exist?
@require_http_methods(['POST'])
def emailExists(request):
    payload = json.loads(request.body)
    email = payload.get('email', None)

    try:
        User.objects.get(email=email)
        data = json.dumps({'Exists': True})
    except User.DoesNotExist:
        data = json.dumps({'Exists': False})

    return HttpResponse(data, content_type='application/json')


@require_http_methods(['POST'])
def sendEmail(request):

    payload = json.loads(request.body)
    email = payload.get('email', None)

    key = randomKeyGenerator()

    message = "Hello, please use this verification code to reset your password! Thank you! \n\n" + key

    send_mail(
        subject='Reset Password',
        message=message,
        from_email=settings.EMAIL_HOST_USER,
        recipient_list=[email]
    )

    data = json.dumps({'Key': key})

    return HttpResponse(data, content_type='application/json')


@require_http_methods(['POST'])
def resetPassword(request):
    payload = json.loads(request.body)

    username = payload.get('username', None)
    password1 = payload.get('password1', None)
    password2 = payload.get('password2', None)

    logger.debug(username)
    logger.debug(password1)
    logger.debug(password2)

    if password1 != password2:
        logging.debug('password not matching')
        data = json.dumps({'message': "Passwords don't match"})
        return HttpResponse(data, content_type='application/json', status=403)

    else:
        user = User.objects.get(username=username)
        user.set_password(password1)
        user.save()

    data = json.dumps({'message': "Passwords match and password is saved"})
    return HttpResponse(data, content_type='application/json', status=200)


@require_http_methods(["GET"])
def profile(request):
    if request.user.id is not None:
        data = _serialized_current_user(request)
    else:
        data = json.dumps({'isActive': False})
    return HttpResponse(data, content_type='application/json')


@require_http_methods(["POST"])
def login(request):
    payload = json.loads(request.body)
    user = auth.authenticate(username=payload.get('username', None),
                             password=payload.get('password', None))
    if user is not None:
        logger.debug('logged in success')
        auth.login(request, user)
        data = _serialized_current_user(request)
        return HttpResponse(data, content_type='application/json')
    else:
        logger.debug('user does not exist')
        data = json.dumps({'message': "Unable to login"})
        return HttpResponse(data, content_type='application/json', status=403)


@require_http_methods(["POST"])
def register(request):
    try:
        payload = json.loads(request.body)

        first_name = payload.get('first_name', None)
        last_name = payload.get('last_name', None)
        email = payload.get('email', None)
        username = payload.get('username', None)
        password1 = payload.get('password1', None)
        password2 = payload.get('password2', None)

        # first verify passwords match
        if password1 != password2:
            logging.debug('password not matching')
            data = json.dumps({'message': "Passwords don't match"})
            return HttpResponse(data, content_type='application/json', status=403)

        # next verify email is new
        try:
            user = User.objects.get(email__exact=email)
            logger.debug('Email taken')
            data = json.dumps({'message': "Email already exists"})
            return HttpResponse(data, content_type='application/json', status=403)
        except User.DoesNotExist:
            pass
        # checks out, make a new user
        created_user = User.objects.create_user(username=username, password=password1, email=email,
                                                first_name=first_name, last_name=last_name)
        created_user.save()
        logging.debug('new user created')
        data = json.dumps({'message': "new user created"})
        return HttpResponse(data, content_type='application/json', status=200)
    except Exception as e:
        data = json.dumps({'message': e.message})
        return HttpResponse(data, content_type='application/json', status=400)


@require_http_methods(["POST"])
def logout(request):
    logging.debug('logout success')
    auth.logout(request)
    data = json.dumps({'message': "Logged Out"})
    return HttpResponse(data, content_type='application/json')


def _serialized_current_user(request) -> str:
    current_user = request.user
    serialized_data = serializers.serialize('json', [current_user, ])
    data = json.loads(serialized_data)[0]['fields']
    camelcase_data = humps.camelize(data)
    return json.dumps(camelcase_data)
