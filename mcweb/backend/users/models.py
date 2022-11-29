from django.db import models
from django.contrib.auth.models import User


# this is how Django recommends adding custom information to the User object - adding in second model with custom info
class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    notes = models.TextField(null=True, blank=True)
    has_consented = models.BooleanField(default=False)
    was_imported = models.BooleanField(default=False)
    imported_password_hash = models.TextField(null=True, blank=True)
    registered = models.BooleanField(default=False, null=True, blank=True)