from django import forms
from django.contrib.auth import get_user_model
from ..sources.models import Collection

User = get_user_model()

class UserAdminForm(forms.ModelForm):
    collection_id = forms.IntegerField(
        required=False,
        label="Grant edit permission for Collection (enter Collection ID)",
        help_text="Enter a collection ID to grant edit permission. Leave blank to skip."
    )

    class Meta:
        model = User
        fields = '__all__'

    def clean_collection_id(self):
        #Allows us to validate and only accept actual collection ids. 
        collection_id = self.cleaned_data.get("collection_id")
        if collection_id:
            try:
                collection = Collection.objects.get(pk=collection_id)
                return collection_id 
            except Collection.DoesNotExist:
                raise forms.ValidationError(f"Collection with id {collection_id} does not exist")
        return collection_id