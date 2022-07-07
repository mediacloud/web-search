
from django.contrib import messages
from django.shortcuts import redirect, render
from django.contrib.auth.models import User, auth

# views are python functions or classes that
# recieve a web request and return a web response


def index(request):
    return render(request, 'frontend/index.html')


def register(request):
    print('hello world')

    if(request.method == 'POST'):
        first_name = request.POST['first_name']
        last_name = request.POST['last_name']
        username = request.POST['username']
        password1 = request.POST['password1']
        password2 = request.POST['password2']
        email = request.POST['email']

        if password1 == password2:
            if User.objects.filter(username=username).exists():
                messages.info(request, 'Username taken')
                print('Username taken')
                return redirect('register')
            elif User.objects.filter(email=email).exists():
                print('Email Exists')
                messages.info(request, 'Email Taken')
                return redirect('register')
            else:
                print('User Created')
                user = User.objects.create_user(
                    username=username, password=password1, email=email, first_name=first_name, last_name=last_name)
                user.save()
        else:
            print('password not matching')
            messages.info(request, 'password not matching')
            return redirect('/')
        return redirect('/')
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
            auth.login(request, user)
            return redirect("/")
        else:
            messages.info(request, 'invalid credentials')
            return redirect('/')
