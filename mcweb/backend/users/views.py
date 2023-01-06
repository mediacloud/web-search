import string
import random
import json
import logging
from django.http import HttpResponse
from django.views.decorators.http import require_http_methods
from django.contrib.auth.models import auth, User
import humps
from django.core.mail import send_mail
import settings
from django.apps import apps
from django.contrib.auth.decorators import login_required
from util.send_emails import send_signup_email
import backend.users.legacy as legacy
from django.core import serializers
from .models import Profile


logger = logging.getLogger(__name__)


# reset password 

@require_http_methods(["POST"])
def reset_password(request):
   
    payload = json.loads(request.body)

    email = payload.get('email')

    logger.debug(email)


    data = json.dumps({"message": "hello"})
    return HttpResponse(data, content_type='application/json')




@login_required(redirect_field_name='/auth/login')
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
    logger.debug(payload)
    entered_username = payload.get('username', None)
    entered_password = payload.get('password', None)
    user = auth.authenticate(username=entered_username, password=entered_password)

    # password and username correct
    if user is not None:
        if user.is_active:
            # ✅ login worked
            logger.debug('logged in success')
            auth.login(request, user)
            data = _serialized_current_user(request)
            return HttpResponse(data, content_type='application/json')
        else:
            # ⚠️ user inactive
            logger.debug('inactive user login attempted')
            data = json.dumps({'message': "Inactive user"})
            return HttpResponse(data, content_type='application/json', status=403)
    # ❌ something went wrong
    else:
        # ⚠️ first time legacy login (so they used email)
        matching_user = User.objects.get(username=entered_username)
        if matching_user is not None:
            if (len(matching_user.password) == 0) and\
                    (legacy.password_matches_hash(entered_password, matching_user.profile.imported_password_hash)):
                # save their password in Django format for next time
                matching_user.set_password(entered_password)  # this will hash it properly
                matching_user.save()
                # ✅ log them in
                user = auth.authenticate(username=entered_username, password=entered_password)
                auth.login(request, user)
                data = _serialized_current_user(request)
                return HttpResponse(data, content_type='application/json')
        # ❌ username or password was wrong (legacy or new user)
        logger.debug('user login failed')
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
        notes = payload.get('notes', None)

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
        except Exception as e:
            pass
        # checks out, make a new user
        created_user = User.objects.create_user(username=username, password=password1, email=email,
                                                first_name=first_name, last_name=last_name)
        created_user.save()
        logging.debug('new user created')
        user_profile = Profile()
        user_profile.user = created_user
        user_profile.notes = notes
        user_profile.save()
        send_signup_email(created_user, request)
        data = json.dumps({'message': "new user created"})
        return HttpResponse(data, content_type='application/json', status=200)
    except Exception as e:
        print(e)
        data = json.dumps({'message': str(e)})
        return HttpResponse(data, content_type='application/json', status=400)


@login_required(redirect_field_name='/auth/login')
@require_http_methods(["POST"])
def logout(request):
    logging.debug('logout success')
    auth.logout(request)
    data = json.dumps({'message': "Logged Out"})
    return HttpResponse(data, content_type='application/json')

@login_required(redirect_field_name='/auth/login')
@require_http_methods(["DELETE"])
def delete_user(request):
    logging.debug('deleting user')
    current_user = request.user
    auth.logout(request)
    try: 
        current_user.delete()
        data = json.dumps({'message': "User Deleted"})
    except Exception as e:
        data = json.dumps({'error': e})
    
    return HttpResponse(data, content_type='application/json')


def _serialized_current_user(request) -> str:
    current_user = request.user
    serialized_data = serializers.serialize('json', [current_user, ])
    data = json.loads(serialized_data)[0]['fields']
    # pull in the user token too
    Token = apps.get_model('authtoken', 'Token')
    token = Token.objects.get(user=current_user)
    data['token'] = token.key
    # return it nicely
    camelcase_data = humps.camelize(data)
    return json.dumps(camelcase_data)

