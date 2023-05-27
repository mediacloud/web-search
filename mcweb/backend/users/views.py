import string
import random
import json
import logging
from django.http import HttpResponse
from django.views.decorators.http import require_http_methods
from django.contrib.auth.models import auth, User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
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


# random key generator
def _random_key():
    return ''.join(random.choice(string.ascii_uppercase + string.digits) for i in range(8))

# does the email exist?


@require_http_methods(['GET'])
def email_exists(request):
    email = request.GET['email']

    try:
        User.objects.get(email=email)
        data = json.dumps({'Exists': True})
    except User.DoesNotExist:
        data = json.dumps({'Exists': False})

    return HttpResponse(data, content_type='application/json')


@require_http_methods(['GET'])
def reset_password_request(request):
    email = request.GET['email']

    key = _random_key()

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
def reset_password(request):
    payload = json.loads(request.body)

    username = payload.get('username', None)
    password1 = payload.get('password1', None)
    password2 = payload.get('password2', None)

    try:
        User.objects.get(username=username)
        logger.debug("Username found")
    except User.DoesNotExist:
        logger.debug("Username not found")
        data = json.dumps({'message': "Username Not Found"})
        return HttpResponse(data, content_type='application/json', status=403)

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


@login_required(redirect_field_name='/auth/login')
@require_http_methods(["GET"])
def profile(request):
    if request.user.id is not None:
        data = _serialized_current_user(request)
    else:
        data = json.dumps({'isActive': False})
    return HttpResponse(data, content_type='application/json')


@require_http_methods(["GET"])
def password_strength(request):
    password1 = request.GET.get('password1')
    password2 = request.GET.get('password2')

    error_messages = []

    if password1 != password2:
        error_messages.append("Your passwords do not match.")
        data = json.dumps(error_messages)
        return HttpResponse(data, content_type='application/json')
    try:
        validate_password(password1)
    except ValidationError as e:
        # Password is invalid, handle the error gracefully
        error_messages.extend(list(e.messages))

    print(error_messages)

    # instead of rewriting the django built in validation errors, I'm going to replace them manually
    for i in range(len(error_messages)):
        if error_messages[i] == "This password is too short. It must contain at least 10 characters.":
            error_messages[i] = "Your password must contain at least 10 characters."
        if error_messages[i] == "This passwords is too common.":
            error_messages[i] = "Your password is too common."

    data = json.dumps(error_messages)
    return HttpResponse(data, content_type='application/json')


@require_http_methods(["POST"])
def login(request):
    payload = json.loads(request.body)
    entered_username = payload.get('username', None)
    entered_password = payload.get('password', None)
    user = auth.authenticate(username=entered_username,
                             password=entered_password)

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
                # this will hash it properly
                matching_user.set_password(entered_password)
                matching_user.save()
                # ✅ log them in
                user = auth.authenticate(
                    username=entered_username, password=entered_password)
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

        """"
        verifies is password passes:
         -  minimum length of the password is 10 characters
         -  password doesn't occurs in a list of 20,000 common passwords
         -  the password isn't entirely numeric
         -  at least 3 numbers
         -  at least 1 special character (['!', '@', '#', '$'])
        """
        validate_password(password1)

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
