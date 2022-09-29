from rest_framework import viewsets, permissions 
from ..sources.models import Collection
from ..sources.serializer import CollectionListSerializer
from rest_framework.response import Response

class SearchViewSet(viewsets.ModelViewSet):
    queryset = Collection.objects.all()
    permission_classes = [
        permissions.AllowAny
    ]
    serializer_class = CollectionListSerializer

    def list(self, request):
        print(request.query_params)
        
        return Response([{"id":1, "name": "sweet collection"}])
