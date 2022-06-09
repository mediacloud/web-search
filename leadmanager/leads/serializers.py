from rest_framework import serializers
from leads.models import User

# Lead Serializer 

class LeadSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = '__all__'