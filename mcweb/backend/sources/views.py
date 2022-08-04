from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Feed, Source, Collection
from .serializer import FeedsSerializer, SourcesSerializer, CollectionSerializer
from django.views.decorators.http import require_http_methods
from django.http import HttpResponse 
import json 
import logging 



@api_view(['GET'])
def ApiOverview(request):
    api_url = {
        'all_items': '/',
        'Add': '/create',
        'Update': '/update/pk',
        'Delete': '/item/pk/delete'
    }
    return HttpResponse(api_url, content_type='application/json')
