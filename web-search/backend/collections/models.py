from django.db import models 

class Collection(models.Model):
    # big int 
    id = models.BigIntegerField()
    name = models.CharField()
    notes = models.CharField()
    created_at = models.DateTimeField(auto_now_add= True)
    modified_at = models.DateTimeField(modified_at= True)