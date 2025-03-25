# credit to https://medium.com/@manjongmanka/password-resets-with-django-rest-framework-7122ffeadb6a
from rest_framework import serializers

class ResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    reset_type = serializers.CharField(required=True)

class ResetPasswordSerializer(serializers.Serializer):
    new_password = serializers.RegexField(
        regex=r'^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$',
        write_only=True,
        error_messages={'invalid': ('Password must be at least 8 characters long with at least one capital letter and symbol')})
    confirm_password = serializers.CharField(write_only=True, required=True)
    token = serializers.CharField(write_only=True, required=True)