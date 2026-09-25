from django import forms
from django.test import TestCase

from ..forms import UserAdminForm
from ...sources.models import Collection


class UserAdminFormCleanCollectionIdTest(TestCase):
    """
    clean_collection_id gates the "grant edit permission for Collection"
    admin feature (CustomUserAdmin.save_model uses its return value to call
    assign_perm) -- real validation logic with no direct test.
    """

    def _clean(self, collection_id):
        form = UserAdminForm()
        form.cleaned_data = {"collection_id": collection_id}
        return form.clean_collection_id()

    def test_existing_collection_id_passes_through_unchanged(self):
        collection = Collection.objects.create(name="Admin Form Test Collection")

        self.assertEqual(self._clean(collection.id), collection.id)

    def test_nonexistent_collection_id_raises_validation_error(self):
        with self.assertRaises(forms.ValidationError):
            self._clean(999999)

