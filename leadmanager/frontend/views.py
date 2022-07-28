import logging
from django.contrib import messages
from django.shortcuts import redirect, render
from django.contrib.auth.models import User, auth
from django.views.decorators.csrf import ensure_csrf_cookie

# views are python functions or classes that
# recieve a web request and return a web response


logger = logging.getLogger(__name__)

@ensure_csrf_cookie
def index(request):
    return render(request, 'frontend/index.html')
