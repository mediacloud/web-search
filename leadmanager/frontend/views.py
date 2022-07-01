
from django.contrib import messages
from django.shortcuts import redirect, render
from django.contrib.auth.models import auth

# views are python functions or classes that
# recieve a web request and return a web response


def index(request):
    return render(request, 'frontend/index.html')


def logout(request):
    auth.logout(request)
    return redirect('/')


def login(request):
    if(request.method == 'POST'):
        username = request.POST['username']
        password = request.POST['password']

        user = auth.authenticate(username=username, password=password)

        if user is not None:
          auth.login(request,user)
          return redirect("/")
        else: 
          messages.info(request, 'invalid credentials')
          return redirect('login')
