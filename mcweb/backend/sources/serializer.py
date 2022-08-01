from dataclasses import field 
from rest_framework import serializers
from .models import Collection


# Serializers in Django REST Framework are responsible for converting objects 
# into data types understandable by javascript and 
# front-end frameworks. Serializers also provide deserialization, 
# allowing parsed data to be converted back into complex types, 
# after first validating the incoming data.

class CollectionSerializer(serializers.ModelSerializer):
    class Meta: 
        model = Collection
        feilds = '__all__'
