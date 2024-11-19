from django.db import models
from django.contrib import admin


##Probably also add "date" interface?
class ConfigProperty(models.Model):

    TYPE_CHOICES = [
        ('bool', 'Boolean'),
        ('int', 'Integer'),
        ('str', 'String'),
    ]

    section_name = models.CharField(max_length=255)
    property_name = models.CharField(max_length=255)
    property_value = models.CharField(max_length=255)
    property_type = models.CharField(max_length=50, choices=TYPE_CHOICES)

    def get_typed_value(self):
        if self.property_type == "bool":
            return self.property_value == "True"
        elif self.property_type == "int":
            return int(self.property_value)
        return self.property_value

    def __str__(self):
        return f"{self.section_name}.{self.property_name}: {self.property_value}"

    class Meta:
        verbose_name = "Configuration Property"
        verbose_name_plural = "Configuration Properties"
        constraints = [
            models.UniqueConstraint(fields=['section_name', 'property_name'], name='section_name.property_name must be unique')
        ]