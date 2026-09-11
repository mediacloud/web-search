import json
import logging
from django.http import HttpResponse
from django.views.decorators.http import require_http_methods
from django.contrib.auth.models import auth, User
from rest_framework.response import Response
from rest_framework.authentication import SessionAuthentication, TokenAuthentication
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from django.core.exceptions import ValidationError
import humps
from django.apps import apps
from django.contrib.auth.decorators import login_required
from util.send_emails import send_signup_email
from util.stats import api_stats
import backend.users.legacy as legacy
from django.core import serializers
from guardian.shortcuts import get_objects_for_user
from .models import Profile, QuotaHistory, ResetCodes
from ..sources.models import Collection
from ..sources.permissions import get_groups

# sanity check: full validation done in frontend
MIN_PASSWORD = 8

logger = logging.getLogger(__name__)

def _auth_err_message(message: str, *, status: int = 403) -> HttpResponse:
    """
    shorthand to return HTTP error (default 403 Forbidden)
    with explanation in JSON "message" field
    """
    logger.debug("_auth_err_message (%d) %s", status, message)
    data = json.dumps({'message': message})
    return HttpResponse(data, content_type='application/json', status=status)

def _auth_err_error(error: str, *, status: int = 403) -> HttpResponse:
    """
    shorthand to return HTTP error (default 403 Forbidden)
    with explanation in JSON "error" field
    """
    logger.debug("_auth_err_error (%d) %s", status, error)
    data = json.dumps({'error': error})
    return HttpResponse(data, content_type='application/json', status=status)

@api_stats  # PLEASE KEEP FIRST!
@api_view(['GET'])
@authentication_classes([TokenAuthentication, SessionAuthentication])
@permission_classes([IsAuthenticated])
def profile(request):
    token = request.headers.get('Authorization', None)
    user = None
    if token:
        try:
            user = _user_from_token(token) # MAY RETURN None!!
        except:
            return _auth_err_message("API Token Not Found")
    if request.user.id is not None and not user:
        data = _serialized_current_user(request)
    elif user:
        data = json.dumps(_serialized_api_user(user))
    else:
        return _auth_err_message("User Not Found")
    return HttpResponse(data, content_type='application/json')

@api_stats  # PLEASE KEEP FIRST!
@require_http_methods(["POST"])
def login(request):
    payload = json.loads(request.body)
    entered_username = payload.get('username', None)
    trimmed_username = entered_username.strip() if entered_username else None
    trimmed_password = payload.get('password', None).strip() if payload.get('password', None) else None
    entered_password = payload.get('password', None)

    user = auth.authenticate(username=trimmed_username, password=trimmed_password)

    # If not found, try to treat the username as an email
    if user is None and trimmed_username:
        try:
            user_obj = User.objects.get(email__iexact=trimmed_username)
            user = auth.authenticate(username=user_obj.username, password=trimmed_password)
        except User.DoesNotExist:
            user = None

    # password and username/email correct
    if user is not None:
        if not user.profile.verified_email:
            # ⚠️ email not verified
            return _auth_err_message("Email not verified, please check your email for verification link")
        elif user.is_active:
            # ✅ login worked
            logger.debug('logged in success')
            auth.login(request, user)
            data = _serialized_current_user(request)
            return HttpResponse(data, content_type='application/json')
        else:
            # ⚠️ user inactive
            return _auth_err_message("Inactive user")
    # ❌ something went wrong
    else:
        # ⚠️ first time legacy login (so they used email)
        try:
            matching_user = User.objects.get(username=entered_username)
        except User.DoesNotExist:
            matching_user = None
        if matching_user is not None:
            if (len(matching_user.password) == 0) and\
                    (legacy.password_matches_hash(entered_password, matching_user.profile.imported_password_hash)):
                # save their password in Django format for next time
                matching_user.set_password(entered_password)
                matching_user.save()
                # ✅ log them in
                user = auth.authenticate(
                    username=entered_username, password=entered_password)
                auth.login(request, user)
                data = _serialized_current_user(request)
                return HttpResponse(data, content_type='application/json')
        # ❌ username or password was wrong (legacy or new user)
        return _auth_err_message("Unable to login")


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
        password1 = payload.get('password1', None)
        password2 = payload.get('password2', None)
        notes = payload.get('notes', None)
        notes = notes.strip() if notes else None

        if password1 is None or password2 is None:
            return _auth_err_message("Passwords missing")

        password1 = password1.strip()
        password2 = password2.strip()

        # first verify passwords match
        # already tested by MatchingPasswords!
        # (could get by with a single password datum)
        if password1 != password2:
            return _auth_err_message("Passwords don't match")

        # strength already tested by MatchingPasswords!
        if len(password1) < MIN_PASSWORD: # sanity check!
            return _auth_err_message("Password too short")

        # verify if the email is left empty
        if email == "" or '@' not in email:
            logging.debug("Email is either empty or doesn't contain an @")
            return _auth_err_message("Invalid email")

        # next verify email is new
        try:
            # was using email__exact, while login endpoint using email__iexact
            # (case insensitive) so changed this to case-insensitive as well
            # to try to prevent multiple entries with differently cased versions
            # of the same email address.

            # If email was guaranteed to be plain ASCII/bytes would be tempted
            # to use email.lower(), but case flattening unicode is a delicate
            # business, so foisting it onto the database at comparison time (and
            # presumably the database does the comparison correctly) rather than
            # throwing out information the user entered!
            user = User.objects.get(email__iexact=email)
            return _auth_err_message("Email already exists")
        except Exception as e:
            pass                # no user with matching email!
        # checks out, make a new user

        # NOTE!! Removed username from mcweb/frontend/src/features/auth/SignUp.jsx
        # passing email from UI as both username and email:
        created_user = User.objects.create_user(username=email, password=password1, email=email,
                                                first_name=first_name, last_name=last_name)
        created_user.save()
        logging.debug('new user created')
        user_profile = Profile()
        user_profile.user = created_user
        user_profile.notes = notes
        user_profile.verified_email = False
        user_profile.save()
        data = json.dumps({'message': "new user created", "email": created_user.email})
        return HttpResponse(data, content_type='application/json', status=200)
    except Exception as e:
        logger.exception("register")
        return _auth_err_message(str(e), status=400)


@api_stats  # PLEASE KEEP FIRST!
@login_required(login_url='/sign-in')
@require_http_methods(["POST"])
def logout(request):
    logging.debug('logout success')
    auth.logout(request)
    data = json.dumps({'message': "Logged Out"})
    return HttpResponse(data, content_type='application/json')


@api_stats  # PLEASE KEEP FIRST!
@login_required(login_url='/sign-in')
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
@login_required(login_url='/sign-in')
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
        return _auth_err_error(str(e), status=400)
    
@api_stats  # PLEASE KEEP FIRST!
@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def email_from_token(request):
    token = request.GET.get('Authorization', None)
    user_token = request.GET.get('user', None)
    if token:
        try:
            user = _user_from_token(token) # MAY RETURN None!!
        except:
            return _auth_err_error("API Token Not Found")
        if user is None:
            return _auth_err_error("API Token Not Found")
    else:
        return _auth_err_error("No token provided")
    if user.is_superuser and user_token:
        user = _user_from_token(user_token) # MAY RETURN None!!
        if user is None:
            return _auth_err_error("API Token Not Found")
        return HttpResponse(json.dumps({"email": user.email}), content_type='application/json')
    elif not user.is_superuser:
        return _auth_err_error("Must be super user")
    elif not user_token:
        return _auth_err_error("No user token provided")


@api_stats  # PLEASE KEEP FIRST!
@api_view(['GET'])
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
            user = _user_from_token(token) # MAY RETURN None!!
        except:
            return _auth_err_message("API Token Not Found")
        if user is None:
            return _auth_err_message("API Token Not Found")
    else:
        user = request.user
    if not (user.is_staff or user.is_superuser):
        return _auth_err_message("Must be staff or superuser")
    quotas = QuotaHistory.objects.filter(week__gte=QuotaHistory.objects.latest('week').week).order_by('-hits')[:40]
    data = json.dumps([{
        'user': quota.user.id,
        'email': quota.user.email,
        'provider': quota.provider,
        'hits': quota.hits,
        'week': quota.week.strftime('%Y-%m-%d'),
    } for quota in quotas])
    return HttpResponse(data, content_type='application/json')

@api_stats  # PLEASE KEEP FIRST!
@require_http_methods(["POST"])
@permission_classes([AllowAny])
def reset_password(request):
    """
    was api.ResetPassword class (a view)
    """

    try:
        data = json.loads(request.body)
        token = data.get('token')
        logging.debug("reset_password: token %s", token)
        reset_obj = ResetCodes.objects.filter(token=token).first()
    except:
        logger.exception("reset_password")
        return _auth_err_error('Invalid request', status=400)

    if not reset_obj:
        return _auth_err_error('Invalid token', status=400)

    new_password = data.get('new_password', '').strip()
    confirm_password = data.get('confirm_password', '').strip()

    # already tested by MatchingPasswords
    # (could get by with just new_password)!
    if new_password != confirm_password:
        return _auth_err_error("Passwords don't match", status=400)

    # strength already tested by MatchingPasswords!
    if len(new_password) < MIN_PASSWORD:  # sanity check!!
        return _auth_err_error('Password too short', status=400)

    # was email=reset_obj.email (case sensitive)
    user = User.objects.filter(email__iexact=reset_obj.email).first()
    if user:
        user.set_password(new_password)
        user.save()
        reset_obj.delete()
        return HttpResponse(json.dumps({'success':'Password updated'}), content_type='application/json')
    else:
        return _auth_err_error('No user found', status=404)


def get_collections_permissions(user):
    collection_perms = get_objects_for_user(user, 'edit_collection', Collection)
    perms = set(c.id for c in collection_perms)
    return list(perms)

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
    data['quota_limit'] = current_user.profile.quota_mediacloud
    data['collection_perms'] = get_collections_permissions(current_user)
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
    # often called from inside "try", but seems as/more likely
    # to return None if nothing found than to raise exception???
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



