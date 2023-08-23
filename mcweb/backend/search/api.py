from rest_framework import viewsets
from rest_framework import status
from .serializer import SavedSearchSerializer
from .models import SavedSearch
from rest_framework.response import Response
from rest_framework.exceptions import APIException



class SavedSearchesViewSet(viewsets.ModelViewSet):
    queryset = SavedSearch.objects.all()
    serializer_class = SavedSearchSerializer

    # overriden to support filtering by user_id to get user saved searches
    def get_queryset(self):
        queryset = super().get_queryset()
        user_id = self.request.user.id
        if self.request.user.is_authenticated:
            queryset = queryset.filter(user_id=user_id)
        return queryset
    
    def create(self, request):
        data = {"user_id": request.user.id,
                 "name": request.data.get("savedsearch").get("name"),
                 "serialized_search": request.data.get("savedsearch").get("serializedSearch")}
        serializer = SavedSearchSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response({"saved search": serializer.data})
        else:
            error_string = str(serializer.errors) 
            raise APIException(f"{error_string}")
    
    def destroy(self, request, pk=None):
        current = self.get_object()
        current.delete()
        return Response({'deleted_saved_search_id': pk})
