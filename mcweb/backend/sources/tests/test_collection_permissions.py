from django.contrib.auth.models import User
from guardian.shortcuts import assign_perm
from rest_framework.test import APITestCase

from ...users.views import get_collections_permissions
from ..models import Collection

URL = "/api/sources/collections/"


class AnonymousCollectionAccessTest(APITestCase):
    """Anonymous users get nothing from the collections viewset, on any verb."""

    def setUp(self):
        self.collection = Collection.objects.create(name="Public Collection", public=True)

    def test_anonymous_rejected_on_every_verb(self):
        detail_url = f"{URL}{self.collection.id}/"
        self.assertEqual(self.client.get(detail_url).status_code, 401)
        self.assertEqual(self.client.post(URL, {"name": "x"}, format="json").status_code, 401)
        self.assertEqual(self.client.patch(detail_url, {"notes": "x"}, format="json").status_code, 401)
        self.assertEqual(self.client.delete(detail_url).status_code, 401)


class GetCollectionsPermissionsTest(APITestCase):
    """
    get_collections_permissions (backend/users/views.py) populates the
    `collectionPerms` field the frontend uses to decide what a logged in
    user may edit.
    """

    def test_returns_ids_of_collections_user_can_edit(self):
        user = User.objects.create_user(username="perms_check_user", password="pw")
        editable = Collection.objects.create(name="Editable")
        not_editable = Collection.objects.create(name="Not Editable")
        assign_perm("edit_collection", user, editable)

        perms = get_collections_permissions(user)

        self.assertEqual(set(perms), {editable.id})
        self.assertNotIn(not_editable.id, perms)
