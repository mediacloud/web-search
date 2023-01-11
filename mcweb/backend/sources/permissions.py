from rest_framework import permissions


class IsGetOrIsStaff(permissions.BasePermission):

    # users need to be logged in for everything but home page and is read only, is_staff can write
    def has_permission(self, request, view):
        if request.method == 'GET':
            return request.user and request.user.is_authenticated
        return request.user and request.user.is_authenticated and (request.user.is_staff or request.user.is_admin)
