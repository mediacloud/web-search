from django.contrib.auth.models import User
from guardian.shortcuts import assign_perm
from rest_framework.test import APITestCase

from ...users.models import Profile
from ...users.views import get_collections_permissions
from ..models import Collection

URL = "/api/sources/collections/"


class AnonymousCollectionAccessTest(APITestCase):
    """
    test_permissions.py already checks anonymous list access (401); this
    extends that to detail/write, specific to Collections.
    """

    def setUp(self):
        self.collection = Collection.objects.create(name="Public Collection", public=True)

    def test_anonymous_rejected_on_every_verb(self):
        detail_url = f"{URL}{self.collection.id}/"
        self.assertEqual(self.client.get(detail_url).status_code, 401)
        self.assertEqual(self.client.post(URL, {"name": "x"}, format="json").status_code, 401)
        self.assertEqual(self.client.patch(detail_url, {"notes": "x"}, format="json").status_code, 401)
        self.assertEqual(self.client.delete(detail_url).status_code, 401)


class NonStaffNoPermissionCollectionAccessTest(APITestCase):
    """
    A non-staff user with no edit_collection grant at all: can read public
    collections, cannot see private ones, and cannot write anything --
    including plain create, which has no `collection_id` to check a
    permission against and so is unconditionally denied for non-staff.
    """

    def setUp(self):
        self.user = User.objects.create_user(username="collection_plain_user", password="pw")
        Profile.objects.create(user=self.user, verified_email=True, quota_mediacloud=1000)
        self.client.force_login(self.user)
        self.public_collection = Collection.objects.create(name="Public Collection", public=True)
        self.private_collection = Collection.objects.create(name="Private Collection", public=False)

    def test_list_only_shows_public_collections(self):
        response = self.client.get(URL)
        self.assertEqual(response.status_code, 200)
        body = response.data
        results = body["results"] if isinstance(body, dict) and "results" in body else body
        names = {row["name"] for row in results}
        self.assertIn("Public Collection", names)
        self.assertNotIn("Private Collection", names)

    def test_cannot_retrieve_a_private_collection(self):
        response = self.client.get(f"{URL}{self.private_collection.id}/")
        self.assertEqual(response.status_code, 404)

    def test_can_retrieve_a_public_collection(self):
        response = self.client.get(f"{URL}{self.public_collection.id}/")
        self.assertEqual(response.status_code, 200)

    def test_cannot_create_a_new_collection(self):
        response = self.client.post(URL, {"name": "New Collection"}, format="json")
        self.assertEqual(response.status_code, 403)
        self.assertFalse(Collection.objects.filter(name="New Collection").exists())

    def test_cannot_update_a_public_collection(self):
        response = self.client.patch(
            f"{URL}{self.public_collection.id}/", {"notes": "hacked"}, format="json")
        self.assertEqual(response.status_code, 403)

    def test_cannot_delete_a_public_collection(self):
        response = self.client.delete(f"{URL}{self.public_collection.id}/")
        self.assertEqual(response.status_code, 403)


class ContributorCollectionAccessTest(APITestCase):
    """
    A non-staff user with edit_collection on one specific collection (the
    real "contributor" tier this permission class supports). This is the
    highest-value, most novel behavior in this whole area: contributors
    can update the collection they hold the permission on, but can never
    create a new collection (no collection_id exists yet to check), can
    never delete even a collection they can edit, and -- because the
    non-staff public=True filter in get_queryset runs before the
    permission check ever sees the object -- cannot even reach a private
    collection they otherwise have edit_collection on.
    """

    def setUp(self):
        self.user = User.objects.create_user(username="collection_contributor", password="pw")
        Profile.objects.create(user=self.user, verified_email=True, quota_mediacloud=1000)
        self.client.force_login(self.user)
        self.editable_collection = Collection.objects.create(name="Editable Collection", public=True)
        assign_perm("edit_collection", self.user, self.editable_collection)

    def test_can_update_the_collection_they_hold_edit_collection_on(self):
        response = self.client.patch(
            f"{URL}{self.editable_collection.id}/", {"notes": "updated by contributor"}, format="json")
        self.assertEqual(response.status_code, 200, response.content)
        self.editable_collection.refresh_from_db()
        self.assertEqual(self.editable_collection.notes, "updated by contributor")

    def test_cannot_update_a_collection_they_do_not_hold_edit_collection_on(self):
        other = Collection.objects.create(name="Other Collection", public=True)
        response = self.client.patch(f"{URL}{other.id}/", {"notes": "x"}, format="json")
        self.assertEqual(response.status_code, 403)

    def test_still_cannot_create_a_new_collection(self):
        response = self.client.post(URL, {"name": "New Collection"}, format="json")
        self.assertEqual(response.status_code, 403)

    def test_still_cannot_delete_the_collection_they_can_edit(self):
        response = self.client.delete(f"{URL}{self.editable_collection.id}/")
        self.assertEqual(response.status_code, 403)
        self.assertTrue(Collection.objects.filter(pk=self.editable_collection.id).exists())

    def test_cannot_reach_a_private_collection_even_with_edit_collection(self):
        private_collection = Collection.objects.create(name="Private Editable Collection", public=False)
        assign_perm("edit_collection", self.user, private_collection)

        response = self.client.patch(
            f"{URL}{private_collection.id}/", {"notes": "x"}, format="json")
        self.assertEqual(response.status_code, 403)


class StaffCollectionAccessTest(APITestCase):
    """Staff bypass every restriction above: public/private, ownership, and DELETE."""

    def setUp(self):
        self.user = User.objects.create_user(username="collection_staff", password="pw", is_staff=True)
        Profile.objects.create(user=self.user, verified_email=True, quota_mediacloud=1000)
        self.client.force_login(self.user)
        self.private_collection = Collection.objects.create(name="Private Collection", public=False)

    def test_can_retrieve_a_private_collection(self):
        response = self.client.get(f"{URL}{self.private_collection.id}/")
        self.assertEqual(response.status_code, 200)

    def test_can_update_a_collection_with_no_explicit_permission(self):
        response = self.client.patch(
            f"{URL}{self.private_collection.id}/", {"notes": "updated by staff"}, format="json")
        self.assertEqual(response.status_code, 200, response.content)

    def test_can_delete_a_collection(self):
        response = self.client.delete(f"{URL}{self.private_collection.id}/")
        self.assertEqual(response.status_code, 204)


class GetCollectionsPermissionsTest(APITestCase):
    """
    get_collections_permissions (backend/users/views.py) is what populates
    the `collectionPerms` field the frontend uses to decide what a logged
    in user may edit -- untested before.
    """

    def test_returns_ids_of_collections_user_can_edit(self):
        user = User.objects.create_user(username="perms_check_user", password="pw")
        editable = Collection.objects.create(name="Editable")
        not_editable = Collection.objects.create(name="Not Editable")
        assign_perm("edit_collection", user, editable)

        perms = get_collections_permissions(user)

        self.assertEqual(set(perms), {editable.id})
        self.assertNotIn(not_editable.id, perms)

    def test_returns_empty_list_for_user_with_no_grants(self):
        user = User.objects.create_user(username="perms_check_empty_user", password="pw")
        Collection.objects.create(name="Some Collection")

        self.assertEqual(get_collections_permissions(user), [])
