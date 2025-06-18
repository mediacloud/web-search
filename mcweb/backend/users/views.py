import string
import random
import json
import logging
from django.http import HttpResponse
from django.views.decorators.http import require_http_methods
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.contrib.auth.models import auth, User
from django.contrib.auth.password_validation import validate_password
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.authentication import SessionAuthentication, TokenAuthentication
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import action, authentication_classes, permission_classes
from rest_framework.decorators import api_view
from django.core.exceptions import ValidationError
import humps
from django.core.mail import send_mail
import settings
from django.apps import apps
from django.contrib.auth.models import Group
from django.contrib.auth.decorators import login_required
from util.send_emails import send_signup_email
from util.stats import api_stats
import backend.users.legacy as legacy
from django.core import serializers
from .models import Profile, QuotaHistory, ResetCodes, Token
from .serializer import ResetRequestSerializer, ResetPasswordSerializer
from ..sources.permissions import get_groups


logger = logging.getLogger(__name__)


@api_stats  # PLEASE KEEP FIRST!
@authentication_classes([TokenAuthentication, SessionAuthentication])
@permission_classes([IsAuthenticated])
def profile(request):
    token = request.headers.get('Authorization', None)
    user = None
    if token:
        try:
            user = _user_from_token(token)
        except:
            logger.debug("Token not found")
            data = json.dumps({'message': "API Token Not Found"})
            return HttpResponse(data, content_type='application/json', status=403)
    if request.user.id is not None and not user:
        data = _serialized_current_user(request)
    elif user:
        data = json.dumps(_serialized_api_user(user))
    else:
        data = json.dumps({'message': "User Not Found"})
        return HttpResponse(data, content_type='application/json', status=403)
    return HttpResponse(data, content_type='application/json')

@api_stats  # PLEASE KEEP FIRST!
@require_http_methods(["POST"])
def password_strength(request):
    # get the passwords from SignUp.jsx formState

    payload = json.loads(request.body)

    password1 = payload.get('password1', None)
    password2 = payload.get('password2', None)

    # a list for the error messages
    error_messages = []
    # check if the passwords are the same
    if password1 != password2:
        error_messages.append("Your passwords do not match.")
        data = json.dumps(error_messages)
        return HttpResponse(data, content_type='application/json')

    # validate the password, if there are no errors, the password is matching and strong!
    try:
        validate_password(password1)
    # Password is invalid, handle the error gracefully
    except ValidationError as e:
        error_messages.extend(list(e.messages))

    # instead of rewriting the django built in validation errors, I'm going to replace them manually
    for i in range(len(error_messages)):
        if error_messages[i] == "This password is too short. It must contain at least 10 characters.":
            error_messages[i] = "Your password must contain at least 10 characters."
        if error_messages[i] == "This passwords is too common.":
            error_messages[i] = "Your password is too common."

    data = json.dumps(error_messages)

    # return the error messages
    return HttpResponse(data, content_type='application/json')


@api_stats  # PLEASE KEEP FIRST!
@require_http_methods(["POST"])
def login(request):
    payload = json.loads(request.body)
    entered_username = payload.get('username', None)
    trimmed_username = entered_username.strip() if entered_username else None
    trimmed_password = payload.get('password', None).strip() if payload.get('password', None) else None
    entered_password = payload.get('password', None)
    user = auth.authenticate(username=trimmed_username,
                             password=trimmed_password)

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


@api_stats  # PLEASE KEEP FIRST!
@require_http_methods(["POST"])
def register(request):
    try:
        payload = json.loads(request.body)

        first_name = payload.get('first_name', None)
        first_name = first_name.strip() if first_name else None
        last_name = payload.get('last_name', None)
        last_name = last_name.strip() if last_name else None
        email = payload.get('email', None)
        email = email.strip() if email else None
        username = payload.get('username', None)
        username = username.strip() if username else None
        password1 = payload.get('password1', None)
        password1 = password1.strip() if password1 else None
        password2 = payload.get('password2', None)
        password2 = password2.strip() if password2 else None
        notes = payload.get('notes', None)
        notes = notes.strip() if notes else None

        # first verify passwords match
        if password1 != password2:
            logging.debug('password not matching')
            data = json.dumps({'message': "Passwords don't match"})
            return HttpResponse(data, content_type='application/json', status=403)

        # verify if the email is left empty
        if email == "" or '@' not in email:
            logging.debug("Email is either empty or doesn't contain an @")
            data = json.dumps({'message': "Invalid email"})
            return HttpResponse(data, content_type='application/json', status=403)


        """"
        verifies is password passes:
         -  minimum length of the password is 10 characters
         -  password doesn't occurs in a list of 20,000 common passwords
         -  the password isn't entirely numeric
         -  at least 3 numbers
         -  at least 1 special character (['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '~', '/', ':', ';'])
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
        logger.exception(e)
        data = json.dumps({'message': str(e)})
        return HttpResponse(data, content_type='application/json', status=400)


@api_stats  # PLEASE KEEP FIRST!
@login_required(redirect_field_name='/auth/login')
@require_http_methods(["POST"])
def logout(request):
    logging.debug('logout success')
    auth.logout(request)
    data = json.dumps({'message': "Logged Out"})
    return HttpResponse(data, content_type='application/json')


@api_stats  # PLEASE KEEP FIRST!
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


@api_stats  # PLEASE KEEP FIRST!
@login_required(redirect_field_name='/auth/login')
@require_http_methods(["POST"])
def reset_token(request):
    current_user = request.user
    try:
        # get Token
        Token = apps.get_model('authtoken', 'Token')
        # delete current_user token
        Token.objects.filter(user=current_user).delete()
        # create a new token
        Token.objects.create(user=current_user)
        data = json.dumps({'message': "New token created!"})
        return HttpResponse(data, content_type='application/json', status=200)
    except Exception as e:
        data = json.dumps({'error': e})
        return HttpResponse(data, content_type='application/json', status=400)
    
@api_stats  # PLEASE KEEP FIRST!
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def email_from_token(request):
    token = request.GET.get('Authorization', None)
    user_token = request.GET.get('user', None)
    if token:
        try:
            user = _user_from_token(token)
        except:
            logger.debug("Token not found")
            data = json.dumps({'message': "API Token Not Found"})
            return HttpResponse(data, content_type='application/json', status=403)
    else:
        data = json.dumps({'message': "No token provided"})
        return HttpResponse(data, content_type='application/json', status=403)
    if user.is_superuser and user_token:
        user = _user_from_token(user_token)
        return HttpResponse(json.dumps({"email": user.email}), content_type='application/json')
    elif not user.is_superuser:
        return HttpResponse(json.dumps({"error": "Must be super user"}), content_type='application/json', status=403)
    elif not user_token:
        return HttpResponse(json.dumps({"error": "No user token provided"}), content_type='application/json', status=403)
    

@api_stats  # PLEASE KEEP FIRST!
@authentication_classes([TokenAuthentication, SessionAuthentication])
@permission_classes([IsAuthenticated])
def users_quotas(request):
    """
    Returns a list of users with the highest quota hits for the week 
    """
    token = request.GET.get('Authorization', None)
    user = None
    if token:
        try:
            user = _user_from_token(token)
        except:
            logger.debug("Token not found")
            data = json.dumps({'message': "API Token Not Found"})
            return HttpResponse(data, content_type='application/json', status=403)
    else:
        user = request.user
    if user.is_staff or user.is_superuser:
        quotas = QuotaHistory.objects.filter(week__gte=QuotaHistory.objects.latest('week').week).order_by('-hits')[:40]
        data = json.dumps([{
            'user': quota.user.id,
            'email': quota.user.email,
            'provider': quota.provider,
            'hits': quota.hits,
            'week': quota.week.strftime('%Y-%m-%d'),
        } for quota in quotas])
    return HttpResponse(data, content_type='application/json')


def _serialized_current_user(request) -> str:
    current_user = request.user
    serialized_data = serializers.serialize('json', [current_user, ])
    data = json.loads(serialized_data)[0]['fields']
    # pull in the user token too
    Token = apps.get_model('authtoken', 'Token')
    token = Token.objects.get(user=current_user)
    data['token'] = token.key
    data['group_names'] = get_groups(request)
    data['quota'] = get_quota(request)
    camelcase_data = humps.camelize(data)
    return json.dumps(camelcase_data)

def _serialized_api_user(user) -> str:
    most_recent_quota = user.quotahistory_set.order_by('-week').first()
    cleaned_user = {
        'id': user.id,
        'username': user.username,
        'is_staff': user.is_staff,
        'is_superuser': user.is_superuser,
        'groups': [group.name for group in user.groups.all()],
        'quota': {
            'provider': most_recent_quota.provider,
            'hits': most_recent_quota.hits,
            'week': most_recent_quota.week.strftime('%Y-%m-%d'),
            'limit': user.profile.quota_mediacloud, 
        } if most_recent_quota else None
    }
    return cleaned_user

def _user_from_token(token):
    token = token.split()[1]
    Token = apps.get_model('authtoken', 'Token')
    token = Token.objects.filter(key=token)
    try:
        token = token[0]
        user = User.objects.filter(pk=token.user_id)
        return user[0]
    except:
        return None
    
def get_quota(request):
    quotas = request.user.quotahistory_set.order_by('-week')[:2]
    quota_list = []
    for quota in quotas:
        quota_list.append({
            'provider': quota.provider,
            'week': quota.week.strftime('%Y-%m-%d'),  # Convert week to string
            'hits': quota.hits
        })

    return quota_list



