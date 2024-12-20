import mcmetadata
import pycountry
import json
from rest_framework import serializers
import mcmetadata.urls as urls
from .models import Collection, Feed, Source
from .tasks import schedule_scrape_source

# Serializers in Django REST Framework are responsible for converting objects
# into data types understandable by javascript and
# front-end frameworks. Serializers also provide deserialization,
# allowing parsed data to be converted back into complex types,
# after first validating the incoming data.

class CollectionSerializer(serializers.ModelSerializer):
    source_count = serializers.IntegerField()

    class Meta:
        model = Collection
        fields = ['id', 'name', 'notes', 'platform', 'source_count', 'public', 'featured', 'managed']


class CollectionWriteSerializer(serializers.ModelSerializer):
    class Meta: 
        model = Collection
        fields = ['id', 'name', 'notes', 'platform', 'public', 'featured', 'managed']


class FeedSerializer(serializers.ModelSerializer):

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


class SourceSerializer(serializers.ModelSerializer):
    # collections = serializers.PrimaryKeyRelatedField(
    #     many=True, write_only=True, queryset=Collection.objects.all()
    # )

    class Meta:
        model = Source
        fields = ['id', 'name', 'url_search_string', 'label', 'homepage', 'notes', 'platform', 'stories_per_week',
                  'first_story', 'created_at', 'modified_at', 'pub_country', 'pub_state', 'primary_language',
                  'media_type', 'last_rescraped', 'last_rescraped_msg']
        extra_kwargs = {'collections': {'required': False}}
    
    def validate_homepage(self, value):
        """
        Check that homepage is present
        """
       
        if value is None:
            raise serializers.ValidationError(f"homepage is required")
        return value
        

    def validate_name(self, value):
        """
        Check that name is normalized version of homepage, ensure name is unique in db
        """
        
        self_id = self.initial_data.get('id', None) 
        homepage = self.initial_data["homepage"]
        canonical_domain = urls.canonical_domain(homepage)
        platform = self.initial_data["platform"]
        url_search_string = self.initial_data.get("url_search_string", None)
        existing_sources = Source.objects.filter(name__exact=value)
        if url_search_string is None or len(url_search_string) == 0:
            if existing_sources.exists():
                if existing_sources[0].id != self_id and self_id is not None:
                    raise serializers.ValidationError(f"name: {value} already exists")
                if self_id is None:
                    raise serializers.ValidationError(f"name: {value} already exists")
            if platform == "online_news":
                if canonical_domain != value:
                    raise serializers.ValidationError(f"name: {value} does not match the canonicalized version of homepage: {homepage}")
        return value
    
    def validate_pub_country(self, value):
        """
        Check that publication country code is valid ISO 3166-1 alpha-3
        """
        country = pycountry.countries.get(alpha_3=value)
        if country is None:
            raise serializers.ValidationError(f"{value}: ISO 3166-1 aplha_3 country code not found")
        return value

    def validate_pub_state(self, value):
        """
        Check that publication state code is valid ISO 3166-2
        """
        country = pycountry.subdivisions.get(code=value)
        if country is None:
            raise serializers.ValidationError(f"{value}: ISO 3166-2 publication state code not found")
        return value

    def validate_primary_language(self, value):
        """
        Check that language code is valid ISO 639-1
        """
        country = pycountry.languages.get(alpha_2=value)
        if country is None:
            raise serializers.ValidationError(f"{value}: ISO 639-1 language code not found")
        return value
    
    def create(self, validated_data):
        new_source = Source.objects.create(**validated_data)
        # user = None
        # request = self.context.get("request")
        # if request and hasattr(request, "user"):
        #     user = request.user
        return new_source

  
        

    
class SourcesViewSerializer(serializers.ModelSerializer):
    collection_count = serializers.IntegerField()

    collections = serializers.PrimaryKeyRelatedField(
        many=True, write_only=True, queryset=Collection.objects.all()
    )

    class Meta:
        model = Source
        fields = ['id', 'name', 'url_search_string', 'label', 'homepage', 'notes', 'platform', 'stories_per_week',
                  'first_story', 'created_at', 'modified_at', 'pub_country', 'pub_state', 'primary_language',
                  'media_type', 'last_rescraped', 'last_rescraped_msg',
                  'collection_count',
                  'collections']
