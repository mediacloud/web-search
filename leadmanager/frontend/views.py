import logging
from django.contrib import messages
from django.shortcuts import redirect, render
from django.contrib.auth.models import User, auth


# views are python functions or classes that
# recieve a web request and return a web response


logger = logging.getLogger(__name__)


def index(request):
    return render(request, 'frontend/index.html')
