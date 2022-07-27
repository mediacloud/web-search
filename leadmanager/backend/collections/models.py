from django.db import models 

class Collection(models.Model):
    id = models.IntegerField()
    name = models.CharField()
    notes = models.CharField()
    mc_tags_id = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add= True)
    modified_at = models.DateTimeField(modified_at = True)