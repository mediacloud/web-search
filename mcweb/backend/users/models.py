from django import db
from django.db import models
from django.contrib.auth.models import User
import datetime as dt
from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver
from rest_framework.authtoken.models import Token


from mc_providers import provider_name, PLATFORM_ONLINE_NEWS, \
    PLATFORM_SOURCE_WAYBACK_MACHINE, PLATFORM_SOURCE_MEDIA_CLOUD
from mc_providers import UnknownProviderException

from .exceptions import OverQuotaException


# this is how Django recommends adding custom information to the User object - adding in second model with custom info
class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    notes = models.TextField(null=True, blank=True)
    has_consented = models.BooleanField(default=False)
    was_imported = models.BooleanField(default=False)
    imported_password_hash = models.TextField(null=True, blank=True)
    # fields that store user-specific weekly quota for each provider, to block system abuse
    quota_mediacloud = models.IntegerField(default=4000, null=False)
    quota_wayback_machine = models.IntegerField(default=4000, null=False)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    modified_at = models.DateTimeField(auto_now=True, null=True)

    def quota_for(self, provider: str) -> int:
        if provider == provider_name(PLATFORM_ONLINE_NEWS, PLATFORM_SOURCE_WAYBACK_MACHINE):
            return self.quota_wayback_machine
        if provider == provider_name(PLATFORM_ONLINE_NEWS, PLATFORM_SOURCE_MEDIA_CLOUD):
            return self.quota_mediacloud
        raise UnknownProviderException(provider, "")

    @classmethod
    def user_provider_quota(cls, user_id: int, provider: str) -> int:
        # as a backup catchall - create the profile in case it isn't there already (maybe for pre-existing user? 🤷🏽‍)
        profile, _ = Profile.objects.get_or_create(user_id=user_id)
        return profile.quota_for(provider)


# track weekly hits against each provider so we can threshold against system abuse, and also give ourselves some
# potentially useful measure of system load/usage (beyond basic web analystics)
class QuotaHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    provider = models.TextField(null=False, blank=False)
    week = models.DateField(null=False, blank=False)
    hits = models.IntegerField(default=0, null=False, blank=False)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    modified_at = models.DateTimeField(auto_now=True, null=True)

    class Meta:
        indexes = [
            # the main index for querying to increment all the time
            models.Index(fields=['user_id', 'provider', 'week'], name='user_quota_lookup_idx'),
            # useful for aggregating provider usage across users
            models.Index(fields=['provider'], name='user_quota_provider_idx'),
            # useful for aggregating total system usage by week
            models.Index(fields=['week'], name='user_quota_week_idx'),
        ]
        constraints = [
            models.UniqueConstraint(fields=['user_id', 'provider', 'week'], name='unique user_provider_week')
        ]

    @classmethod
    def _this_week(cls) -> dt.date:
        # https://stackoverflow.com/questions/19216334/python-give-start-and-end-of-week-data-from-a-given-date
        today = dt.date.today()
        return today - dt.timedelta(days=today.weekday())

    @classmethod
    def current_for(cls, user_id: int, provider: str):
        matching, created = QuotaHistory.objects.get_or_create(user_id=user_id, provider=provider,
                                                               week=cls._this_week())
        return matching


    @classmethod
    def check_quota(cls, user_id: int, is_staff:bool, provider:str):
        matching = cls.current_for(user_id, provider)
        quota = Profile.user_provider_quota(user_id, provider)
        if (quota <= matching.hits) and not is_staff:
            raise OverQuotaException(provider, quota)
        return matching.hits

    @classmethod
    def increment(cls, user_id: int, is_staff: bool, provider: str, amount: int = 1) -> int:
        matching = cls.current_for(user_id, provider)
        matching.hits += amount
        matching.save()
        # raise an error if they are at quota
        quota = Profile.user_provider_quota(user_id, provider)
        if (quota <= matching.hits) and not is_staff:
            raise OverQuotaException(provider, quota)
        return matching.hits
    

class ResetCodes(models.Model):
    email = models.EmailField()
    token = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)


# make sure every user gets an automatically generated API Token
# @see https://www.django-rest-framework.org/api-guide/authentication/#tokenauthentication
@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_auth_token(sender, instance=None, created=False, **kwargs):
    if created:
        Token.objects.create(user=instance)
