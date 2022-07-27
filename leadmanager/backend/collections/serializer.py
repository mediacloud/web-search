from dataclasses import field 
from rest_framework import serializers
from collections.models import Collection 

class CollectionSerializer(serializers.ModelSerializer):
    class Meta: 
        model = Collection
        feilds = '__all__'