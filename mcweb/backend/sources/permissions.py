from rest_framework import permissions
from django.contrib.auth.models import Group
from django.conf import settings
from ..sources.models import Collection

class IsGetOrIsStaffOrContributor(permissions.BasePermission):
    def has_permission(self, request, view):
        modifying_methods = {'POST', 'PUT', 'PATCH'}
        is_collection_view = (
            hasattr(view, 'queryset') and getattr(view.queryset, 'model', None) == Collection
        ) or view.__class__.__name__ in ['CollectionViewSet', 'SourcesCollectionsViewSet']
        is_sources_collections_view = view.__class__.__name__ == 'SourcesCollectionsViewSet'

        if request.method == 'GET':
            return request.user and request.user.is_authenticated

        # DELETE: Only allow if SourcesCollectionsViewSet and user has edit_collection
        if is_collection_view and request.method == 'DELETE':
            if is_sources_collections_view:
                # Detail views
                if hasattr(view, 'get_object') and callable(view.get_object):
                    obj = view.get_object()
                    return request.user.has_perm('edit_collection', obj)
                # Create/list views
                collection_id = request.data.get('collection_id') or request.query_params.get('collection_id')
                if collection_id:
                    try:
                        obj = Collection.objects.get(pk=collection_id)
                        return request.user.has_perm('edit_collection', obj)
                    except Collection.DoesNotExist:
                        return False
            # Not SourcesCollectionsViewSet: never allow DELETE
            return False

        # Other modifying methods (POST, PUT, PATCH)
        if is_collection_view and request.method in modifying_methods:
            # Detail views
            if hasattr(view, 'get_object') and callable(view.get_object):
                obj = view.get_object()
                return request.user.has_perm('edit_collection', obj)
            # Create/list views
            collection_id = request.data.get('collection_id') or request.query_params.get('collection_id')
            if collection_id:
                try:
                    obj = Collection.objects.get(pk=collection_id)
                    return request.user.has_perm('edit_collection', obj)
                except Collection.DoesNotExist:
                    return False

        # Staff and superusers can always write
        if request.user and request.user.is_authenticated and (request.user.is_staff or request.user.is_superuser):
            return True

        return False

def get_groups(request):
    groups = request.user.groups.values_list('name',flat = True) # QuerySet Object
    return list(groups)