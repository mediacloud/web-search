from rest_framework import permissions
from django.contrib.auth.models import Group
from django.conf import settings

class IsGetOrIsStaffOrContributor(permissions.BasePermission):

    # users need to be logged in for everything but home page and is read only, is_staff can write
    def has_permission(self, request, view):
        if request.method == 'GET':
            return request.user and request.user.is_authenticated
        if request.method == 'DELETE':
            return request.user and request.user.is_authenticated and (request.user.is_staff or request.user.is_admin)
        if (settings.Groups.CONTRIBUTOR in get_groups(request) or (request.user.is_staff or request.user.is_admin)) :
            return request.user and request.user.is_authenticated
        else:
            return False

def get_groups(request):
    groups = request.user.groups.values_list('name',flat = True) # QuerySet Object
    return list(groups)