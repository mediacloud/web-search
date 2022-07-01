
from django.shortcuts import redirect, render
from django.contrib.auth.models import auth

# views are python functions or classes that 
# recieve a web request and return a web response 
def index(request):
  return render(request, 'frontend/index.html')



def logout(request):
  auth.logout(request);
  return redirect('/')

def login(request):
  pass
