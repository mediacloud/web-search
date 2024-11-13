from django.db import models
from django.contrib.auth.models import User

# defining a model class to represent saved searches
class SavedSearch(models.Model):
    user_id = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.TextField(null=True, blank=True)
    serialized_search = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    modified_at = models.DateTimeField(auto_now=True, null=True)


