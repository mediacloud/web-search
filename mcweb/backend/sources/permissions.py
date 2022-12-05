from rest_framework import permissions

class IsGetOrIsStaff(permissions.BasePermission):

    def has_permission(self, request, view):
        if request.method == 'GET':
            return request.user and request.user.is_authenticated 
        return request.user and request.user.is_staff