from django.contrib.auth.models import User
from rest_framework.test import APITestCase

from ..models import Collection, Source

URL = "/api/sources/sources/download_csv/"


class SourcesDownloadCsvTest(APITestCase):
    """
    download_csv (used directly via window.location in
    DownloadSourcesCsv.jsx) streams a CSV of a collection's sources -- had
    no coverage at all.
    """

    def setUp(self):
        self.user = User.objects.create_user(username="download_csv_user", password="pw")
        self.client.force_login(self.user)

    def _rows(self, response):
        content = b"".join(response.streaming_content).decode()
        return content.splitlines()

    def test_streams_header_and_source_rows(self):
        collection = Collection.objects.create(name="CSV Test Collection")
        source = Source.objects.create(
            name="example.com", homepage="http://example.com", label="Example",
            platform=Source.SourcePlatforms.ONLINE_NEWS)
        collection.source_set.add(source)

        response = self.client.get(URL, {"collection_id": collection.id})

        self.assertEqual(response.status_code, 200)
        rows = self._rows(response)
        self.assertEqual(rows[0], (
            "id,homepage,domain,url_search_string,label,notes,platform,"
            "pub_country,pub_state,media_type,stories_per_week,last_story,primary_language"
        ))
        self.assertEqual(rows[1], f"{source.id},http://example.com,example.com,,Example,,online_news,,,,0,,")

    def test_collection_with_no_sources_streams_just_the_header(self):
        collection = Collection.objects.create(name="Empty Collection")

        response = self.client.get(URL, {"collection_id": collection.id})

        self.assertEqual(response.status_code, 200)
        rows = self._rows(response)
        self.assertEqual(len(rows), 1)
        self.assertTrue(rows[0].startswith("id,homepage,domain"))

    def test_missing_collection_returns_404(self):
        response = self.client.get(URL, {"collection_id": 999999})
        self.assertEqual(response.status_code, 404)
