from django.db import models 

class Collection(models.Model):
    id = models.IntegerField()
    name = models.CharField()
    notes = models.CharField()
    created_at = models.DateTimeField(auto_now_add= True)
    modified_at = models.DateTimeField(modified_at = True)