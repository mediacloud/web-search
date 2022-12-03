import collections
from rest_framework import serializers
from .models import Collection, Feed, Source


# Serializers in Django REST Framework are responsible for converting objects
# into data types understandable by javascript and
# front-end frameworks. Serializers also provide deserialization,
# allowing parsed data to be converted back into complex types,
# after first validating the incoming data.

class CollectionSerializer(serializers.ModelSerializer):
    source_count = serializers.IntegerField()

    class Meta:
        model = Collection
        #fields = ['id', 'name', 'notes', 'platform']
        fields = ['id', 'name', 'notes', 'platform', 'source_count']


class CollectionListSerializer(serializers.Serializer):
    collections = CollectionSerializer(many=True)


class FeedsSerializer(serializers.ModelSerializer):

    class Meta:
        model = Feed
        fields = '__all__'


class SourcesSerializer(serializers.ModelSerializer):
    collections = serializers.PrimaryKeyRelatedField(
        many=True, write_only=True, queryset=Collection.objects.all()
    )
    class Meta:
        model = Source
        fields = '__all__'

class SourcesCollectionSerializer(serializers.Serializer): 
    collections = CollectionSerializer()
    sources = SourcesSerializer(many=True)

class CollectionsSourceSerializer(serializers.Serializer):
    collections = CollectionSerializer(many=True)
    sources = SourcesSerializer()

class SourceListSerializer(serializers.Serializer):
    sources = SourcesSerializer(many=True)


