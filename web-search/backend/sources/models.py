from django.db import models
from enum import Enum


class ServiceStatus(Enum):
    Online = "Online News"
    You = "Youtube"


class Sources(models.Model):
    # big int
    id = models.BigIntegerField()
    name = models.CharField()
    url_search_string = models.CharField()
    label = models.CharField()
    homepage = models.CharField()
    notes = models.CharField()
    service = models.CharField(max_length=6, choices=[
                               (tag, tag.value) for tag in ServiceStatus])
    mc_media_id = models.BooleanField()
    created_at = models.DateTimeField(auto_now_add=True)
    modified_at = models.DateTimeField(modified_at=True)
    stories_per_week = models.IntegerField()
    #pub_country (enum)
    #pub_state (enum)
    #primary_language (enum)
    #media_type (enum)
