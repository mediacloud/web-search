from django import forms
from django.contrib.auth import get_user_model
from ..sources.models import Collection

User = get_user_model()

class UserAdminForm(forms.ModelForm):
    collection_id = forms.ModelChoiceField(
        queryset=Collection.objects.all(),
        required=False,
        label="Grant edit permission for Collection"
    )

    class Meta:
        model = User
        fields = '__all__'