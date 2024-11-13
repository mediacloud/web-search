from django.db import models
from django.contrib import admin

class ConfigProperty(models.Model):
    property_name = models.CharField(max_length=255, unique=True)
    property_value = models.TextField()

    def __str__(self):
        return f"{self.property_name}: {self.property_value}"

    class Meta:
        verbose_name = "Configuration Property"
        verbose_name_plural = "Configuration Properties"