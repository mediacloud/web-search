
from django.shortcuts import render

# views are python functions or classes that 
# recieve a web request and return a web response 
def index(request):
  return render(request, 'frontend/index.html')