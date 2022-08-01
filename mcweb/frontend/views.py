import logging
from django.shortcuts import redirect, render
from django.views.decorators.csrf import ensure_csrf_cookie

# views are python functions or classes that
# receive a web request and return a web response


logger = logging.getLogger(__name__)

@ensure_csrf_cookie
def index(request):
    return render(request, 'frontend/index.html')
