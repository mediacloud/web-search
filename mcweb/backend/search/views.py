import json
import logging
from django.http import HttpResponse
from django.views.decorators.http import require_http_methods
import datetime as dt

from .platforms import provider_for, PLATFORM_ONLINE_NEWS, PLATFORM_SOURCE_MEDIA_CLOUD


logger = logging.getLogger(__name__)


# search tool
@require_http_methods(["POST"])
def search(request):

  payload = json.loads(request.body)

  query_str = payload.get('query', None)

  logger.debug(len(query_str))

  start_date = payload.get('start', None)
  start_date = dt.datetime.strptime(start_date, '%Y-%m-%d')

  end_date = payload.get('end', None)
  end_date = dt.datetime.strptime(end_date, '%Y-%m-%d')

  provider = provider_for(PLATFORM_ONLINE_NEWS, PLATFORM_SOURCE_MEDIA_CLOUD)
  total_articles = provider.count(query_str, start_date, end_date)
 
  return HttpResponse(json.dumps({"count": total_articles}), content_type="application/json", status=200)
