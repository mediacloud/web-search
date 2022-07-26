import json
import logging
from django.http import HttpResponse
from django.views.decorators.http import require_http_methods
from django.contrib.auth.models import auth, User
from django.core import serializers

