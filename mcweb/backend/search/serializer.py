from rest_framework import serializers
from .models import SavedSearch

class SavedSearchSerializer(serializers.ModelSerializer):

    class Meta:
        model = SavedSearch
        fields = ['id','user_id', 'name', 'serialized_search', 'created_at', 'modified_at']

    def create(self, validated_data):
        return SavedSearch.objects.create(**validated_data)
