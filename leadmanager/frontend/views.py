
from unittest import result
from django.shortcuts import render
from django.shortcuts import HttpResponse

from django.http import JsonResponse
from django.middleware.csrf import get_token

def csrf(request):
  return JsonResponse({"csrfToken": get_token(request)})

def ping(request):
  return JsonResponse({"result": "Ok"})

def index(request):
    return render(request, 'frontend/index.html')



# def SetCookie(request):
#     response = HttpResponse('Visiting for the first time')
#     response.set_cookie('bookname', 'Sherlock Holmes')
#     return response


# def GetCookie(request):
#     bookname = request.COOKIES['bookname']
#     return HttpResponse(f'The book name is: {bookname}')
