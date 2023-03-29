from rest_framework import viewsets
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
        print(user_id)
        if self.request.user.is_authenticated:
            queryset = queryset.filter(user_id=user_id)
        return queryset
    
    def create(self, request):
         print("hi")
    #     data = {"user_id": request.user.id,
    #             "name": request.get("name"),
    #             "seralized_search": request.get("seralized_search")}
    #     print(data)
    #     print("hi")
    #     serializer = SavedSearchSerializer(data=data)
    #     print(serializer)
    #     if serializer.is_valid():
    #         serializer.save()
    #         return Response({"saved search": serializer.data})
    #     else:
    #         error_string = str(serializer.errors) 
    #         print(error_string)
    #         raise APIException(f"{error_string}")