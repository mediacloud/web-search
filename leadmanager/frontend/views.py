import logging
from django.contrib import messages
from django.shortcuts import redirect, render
from django.contrib.auth.models import User, auth


# views are python functions or classes that
# recieve a web request and return a web response


logger = logging.getLogger(__name__)


def index(request):
    return render(request, 'frontend/index.html')


def register(request):

    if(request.method == 'POST'):
        first_name = request.POST['first_name']
        last_name = request.POST['last_name']
        username = request.POST['username']
        password1 = request.POST['password1']
        password2 = request.POST['password2']
        email = request.POST['email']

        
        if password1 == password2:
            
            if User.objects.filter(username=username).exists():
                logging.debug('Username taken')
                messages.info(request, 'Username taken')
                return redirect('/')
            
            elif User.objects.filter(email=email).exists():
                logging.debug('Email Exists')
                messages.info(request, 'Email Taken')
                return redirect('/')
            
            else:
                logging.debug('User Created')
                user = User.objects.create_user(
                    username=username, password=password1, email=email, first_name=first_name, last_name=last_name)
                user.save()
        else:
            logging.debug('password not matching')
            messages.info(request, 'password not matching')
            return redirect('/')
        return redirect('/')
    return render(request, 'frontend/index.html')
