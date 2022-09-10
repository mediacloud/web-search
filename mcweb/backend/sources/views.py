import csv
from django.http import HttpResponse
from rest_framework.response import Response
from django.views.decorators.http import require_http_methods
import json



@require_http_methods(["POST"])
def csvDownload(request):

  response = HttpResponse(
      content_type='text/csv',
      headers={'Content-Disposition': 'attachment; filename="somefilename.csv"'},
  )

  writer = csv.writer(response)

  writer.writerow([['First row', 'Foo', 'Bar', 'Baz']])

  return (response)
