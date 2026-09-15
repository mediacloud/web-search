import csv
import os
from unittest.mock import patch

from django.contrib.auth.models import User
from rest_framework.test import APITestCase

from ..models import ActionHistory, Collection, Source

FIXTURE_PATH = os.path.join(os.path.dirname(__file__), "fixtures", "collecton-262985270.csv")


def load_fixture_rows():
    """
    Mirrors what the frontend's react-papaparse CSVReader (header: true)
    hands to uploadSources: a list of dicts keyed by CSV column name.
    """
    with open(FIXTURE_PATH, newline="") as f:
        return list(csv.DictReader(f))


def without_ids(rows):
    """
    The fixture's `id` column holds primary keys from the production
    database it was exported from. Uploading it as-is into any other
    database (including a test DB, where Postgres's non-transactional
    sequence counters make small pks like 1/2/4/6/7/14 highly likely to
    already be taken) risks colliding with and silently overwriting an
    unrelated existing Source -- see
    test_stale_id_column_can_overwrite_an_unrelated_existing_source below.
    Tests that just want to exercise the normal create/update-by-domain
    path use this to sidestep that hazard.
    """
    return [{k: v for k, v in row.items() if k != "id"} for row in rows]


class UploadSourcesTest(APITestCase):
    """
    upload_sources (used by UploadSources.jsx) is the biggest untested piece
    of SourcesViewSet: per-row create-vs-update-vs-skip matching, bulk
    ActionHistory logging, and collection membership. Exercised here
    against a real CSV exported from a production collection
    (fixtures/collecton-262985270.csv, 45 sources) rather than synthetic
    data, since the row-matching logic is sensitive to real-world
    homepage/domain formatting quirks.
    """

    URL = "/api/sources/sources/upload_sources/"

    def setUp(self):
        self.staff_user = User.objects.create_user(
            username="upload_sources_staff", password="pw", is_staff=True,
            email="staff@example.com")
        self.client.force_login(self.staff_user)
        self.collection = Collection.objects.create(name="Upload Test Collection")

    def _upload(self, sources, rescrape=False):
        return self.client.post(self.URL, {
            "collection_id": self.collection.id,
            "rescrape": rescrape,
            "sources": sources,
        }, format="json")

    def test_uploading_real_fixture_creates_all_sources_and_adds_to_collection(self):
        rows = load_fixture_rows()
        self.assertEqual(len(rows), 45)  # sanity check on the fixture itself

        response = self._upload(without_ids(rows))

        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(response.data, {"created": 45, "updated": 0, "skipped": 0})
        self.assertEqual(self.collection.source_set.count(), 45)

        nytimes = Source.objects.get(name="nytimes.com")
        self.assertEqual(nytimes.homepage, "http://nytimes.com")
        self.assertEqual(nytimes.label, "New York Times")
        self.assertIn("paywall restrictions", nytimes.notes)
        self.assertEqual(nytimes.platform, Source.SourcePlatforms.ONLINE_NEWS)

        parent_history = ActionHistory.objects.filter(
            object_model=ActionHistory.ModelType.COLLECTION, object_id=self.collection.id,
            action_type="bulk_upload_sources").first()
        self.assertIsNotNone(parent_history)
        self.assertEqual(parent_history.changes["sources_created"], 45)
        self.assertEqual(parent_history.changes["sources_updated"], 0)
        self.assertEqual(parent_history.changes["sources_skipped"], 0)

        child_creates = ActionHistory.objects.filter(
            object_model=ActionHistory.ModelType.SOURCE, action_type="create",
            parent_event=parent_history).count()
        self.assertEqual(child_creates, 45)

    def test_uploaded_source_does_not_import_stories_per_week_or_language_or_media_type(self):
        # Source._clean_source has stories_per_week/primary_language/
        # media_type commented out, so none of these round-trip through a
        # CSV that was itself exported with `download_csv` -- worth pinning
        # down since it's an easy trap (re-uploading your own export looks
        # like it should be a no-op, but silently drops these three fields).
        rows = load_fixture_rows()
        foxnews_row = next(r for r in rows if r["domain"] == "foxnews.com")
        self.assertEqual(foxnews_row["stories_per_week"], "932")
        self.assertEqual(foxnews_row["primary_language"], "en")
        self.assertEqual(foxnews_row["media_type"], "video_broadcast")

        response = self._upload(without_ids([foxnews_row]))
        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(response.data, {"created": 1, "updated": 0, "skipped": 0})

        foxnews = Source.objects.get(name="foxnews.com")
        self.assertEqual(foxnews.stories_per_week, 0)
        self.assertIsNone(foxnews.primary_language)
        self.assertIsNone(foxnews.media_type)
        # pub_country/pub_state ARE copied through
        self.assertEqual(foxnews.pub_country, "USA")
        self.assertEqual(foxnews.pub_state, "US-NY")

    def test_reuploading_the_same_rows_updates_instead_of_duplicating(self):
        # deliberately keeps the real `id` column for the SECOND upload,
        # matching the actual "download CSV, edit some fields, reupload"
        # round trip this feature exists for: those ids now correctly
        # refer back to the rows this same test just created.
        rows = load_fixture_rows()
        first = self._upload(without_ids(rows))
        self.assertEqual(first.data, {"created": 45, "updated": 0, "skipped": 0})

        rows_with_real_ids = [
            {**row, "id": str(Source.objects.get(name=row["domain"]).id)}
            for row in rows
        ]
        second = self._upload(rows_with_real_ids)
        self.assertEqual(second.status_code, 200, second.content)
        self.assertEqual(second.data, {"created": 0, "updated": 45, "skipped": 0})
        self.assertEqual(Source.objects.count(), 45)
        self.assertEqual(self.collection.source_set.count(), 45)

    def test_stale_id_pointing_at_a_different_named_source_is_skipped_as_a_conflict(self):
        # Real-world hazard surfaced by the production fixture: its `id`
        # column holds primary keys from the database it was exported
        # from. If those same integer ids already exist in the database
        # being uploaded into -- entirely plausible for small/legacy ids,
        # and specifically how this test's own earlier runs collided by
        # accident via Postgres's non-transactional sequence counter --
        # upload_sources used to silently overwrite that unrelated existing
        # Source instead of creating a new one or reporting an error. Now
        # an id whose existing name doesn't match the row's domain is
        # treated as a conflict and the row is skipped, leaving the
        # unrelated source untouched.
        unrelated = Source.objects.create(
            name="totally-unrelated.com", homepage="http://totally-unrelated.com")

        response = self._upload([{
            "id": str(unrelated.id),
            "homepage": "http://nytimes.com",
            "domain": "nytimes.com",
            "label": "New York Times",
        }])

        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(response.data, {"created": 0, "updated": 0, "skipped": 1})

        unrelated.refresh_from_db()
        self.assertEqual(unrelated.name, "totally-unrelated.com")
        self.assertFalse(Source.objects.filter(name="nytimes.com").exists())

    def test_id_matching_its_existing_source_updates_normally(self):
        # the id-matching path still works fine when the id and domain
        # genuinely agree (the actual "download CSV, edit fields, reupload
        # into the same database" use case this feature exists for).
        source = Source.objects.create(
            name="nytimes.com", homepage="http://nytimes.com", label="old label")

        response = self._upload([{
            "id": str(source.id),
            "homepage": "http://nytimes.com",
            "domain": "nytimes.com",
            "label": "New York Times",
        }])

        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(response.data, {"created": 0, "updated": 1, "skipped": 0})
        source.refresh_from_db()
        self.assertEqual(source.label, "New York Times")

    def test_row_missing_homepage_is_skipped(self):
        response = self._upload([{"domain": "nohomepage.com"}])
        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(response.data, {"created": 0, "updated": 0, "skipped": 1})
        self.assertFalse(Source.objects.filter(name="nohomepage.com").exists())

    def test_empty_row_is_silently_ignored(self):
        response = self._upload([{}])
        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(response.data, {"created": 0, "updated": 0, "skipped": 0})

    def test_ambiguous_match_is_skipped_rather_than_guessed(self):
        # two existing sources share a url_search_string-scoped match target
        # via matching platform+homepage (non-online_news path), so the row
        # matches multiple existing sources and should be cowardly skipped.
        Source.objects.create(
            name="dupe-a", homepage="http://dupe.example.com", platform=Source.SourcePlatforms.YOUTUBE)
        Source.objects.create(
            name="dupe-b", homepage="http://dupe.example.com", platform=Source.SourcePlatforms.YOUTUBE)

        response = self._upload([{"homepage": "http://dupe.example.com", "platform": "youtube"}])

        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(response.data, {"created": 0, "updated": 0, "skipped": 1})

    @patch("backend.sources.api.schedule_scrape_source")
    def test_rescrape_true_schedules_scrape_for_new_sources_without_url_search_string(self, mock_schedule):
        response = self._upload([{
            "homepage": "http://rescrapeme.com", "domain": "rescrapeme.com",
        }], rescrape=True)

        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(response.data, {"created": 1, "updated": 0, "skipped": 0})
        new_source = Source.objects.get(name="rescrapeme.com")
        mock_schedule.assert_called_once_with(new_source.id, self.staff_user)

    @patch("backend.sources.api.schedule_scrape_source")
    def test_rescrape_true_does_not_schedule_for_url_search_string_sources(self, mock_schedule):
        response = self._upload([{
            "homepage": "http://rescrapeme.com", "domain": "rescrapeme.com",
            "url_search_string": "rescrapeme.com/section/*",
        }], rescrape=True)

        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(response.data, {"created": 1, "updated": 0, "skipped": 0})
        mock_schedule.assert_not_called()

    def test_non_staff_user_cannot_upload(self):
        non_staff = User.objects.create_user(username="upload_sources_non_staff", password="pw")
        self.client.force_login(non_staff)
        response = self._upload(load_fixture_rows())
        self.assertEqual(response.status_code, 403)
        self.assertEqual(Source.objects.count(), 0)

    def test_anonymous_cannot_upload(self):
        self.client.logout()
        response = self._upload(load_fixture_rows())
        self.assertEqual(response.status_code, 401)
