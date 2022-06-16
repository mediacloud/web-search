from django.contrib.auth.models import User
from rest_framework import viewsets, permissions, serializers
from .serializers import UserSerializer



class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    current_user = serializers.SerializerMethodField('_user')

    # TO DO: restrict list and get of non-current to admins only

    def get_object(self):
        pk = self.kwargs.get('pk')
        if pk == "current":
            return self.request.user
        return super().get_object()
