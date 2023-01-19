import mcmetadata
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
        fields = ['id', 'name', 'notes', 'platform', 'source_count', 'public', 'featured']


class CollectionWriteSerializer(serializers.ModelSerializer):
    class Meta: 
        model = Collection
        fields = ['id', 'name', 'notes', 'platform', 'public', 'featured']


class FeedsSerializer(serializers.ModelSerializer):

    class Meta:
        model = Feed
        fields = ['id','url', 'admin_rss_enabled', 'source', 'name', 'created_at', 'modified_at']

    # def validate_url(self, value):
    #     print(value)
    #     queryset = Feed.objects.all()
    #     canonical_domain = mcmetadata.feed_url.normalize(value)
    #     existing_feed = queryset.filter(url=canonical_domain)
    #     print(existing_feed)
    #     if len(existing_feed) != 0:
    #       raise serializers.ValidationError("This Feed URL is a duplicate")

    def update(self, instance, validated_data):
        instance.url = validated_data.get('url', instance.url)
        instance.admin_rss_enabled = validated_data.get('admin_rss_enabled', instance.admin_rss_enabled)
        instance.source = validated_data.get('source', instance.source)
        instance.name = validated_data.get('name', instance.name)
        instance.save()
        return instance

    def create(self, validated_data):
        return Feed.objects.create(**validated_data)


class SourcesSerializer(serializers.ModelSerializer):
    collections = serializers.PrimaryKeyRelatedField(
        many=True, write_only=True, queryset=Collection.objects.all()
    )

    class Meta:
        model = Source
        fields = ['id', 'name', 'url_search_string', 'label', 'homepage', 'notes', 'platform', 'stories_per_week',
                  'first_story', 'created_at', 'modified_at', 'pub_country', 'pub_state', 'primary_language',
                  'media_type',
                  'collections']


class SourcesViewSerializer(serializers.ModelSerializer):
    collection_count = serializers.IntegerField()

    collections = serializers.PrimaryKeyRelatedField(
        many=True, write_only=True, queryset=Collection.objects.all()
    )

    class Meta:
        model = Source
        fields = ['id', 'name', 'url_search_string', 'label', 'homepage', 'notes', 'platform', 'stories_per_week',
                  'first_story', 'created_at', 'modified_at', 'pub_country', 'pub_state', 'primary_language',
                  'media_type',
                  'collection_count',
                  'collections']
