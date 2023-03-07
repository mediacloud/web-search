from rest_framework import viewsets
from .serializer import SavedSearchSerializer
from .models import SavedSearch

class SavedSearchesViewSet(viewsets.ModelViewSet):
    queryset = SavedSearch.objects.all()
    serializer_class = SavedSearchSerializer

    # overriden to support filtering by user_id to get user saved searches
    def get_queryset(self):
        queryset = super().get_queryset()
        user_id = self.request.query_params.get("user_id")
        if user_id is not None:
            queryset = queryset.filter(user_id=user_id)
        return queryset