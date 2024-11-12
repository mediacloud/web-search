from django.db import models
from django.contrib.auth.models import User
from django.contrib import admin

# defining a model class to represent saved searches
class SavedSearch(models.Model):
    user_id = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.TextField(null=True, blank=True)
    serialized_search = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    modified_at = models.DateTimeField(auto_now=True, null=True)



class RequestLoggingConfig(models.Model):
    request_logging_enabled = models.BooleanField(default=True)

    def __str__(self):
        return f"Request Logging Enabled: {self.request_logging_enabled}"

    def save(self, *args, **kwargs):
        if RequestLoggingConfig.objects.exists() and not self.pk:
            raise ValidationError("Only one RequestLoggingConfig instance allowed.")
        super(RequestLoggingConfig, self).save(*args, **kwargs)

    @classmethod
    def load(cls):
        obj, created = cls.objects.get_or_create(id=1)
        return obj

    class Meta:
        verbose_name = "Request Logging Configuration"
        verbose_name_plural = "Request Logging Configuration"


@admin.register(RequestLoggingConfig)
class RequestLoggingConfigAdmin(admin.ModelAdmin):
    def has_add_permission(self, request):
        return not RequestLoggingConfig.objects.exists()