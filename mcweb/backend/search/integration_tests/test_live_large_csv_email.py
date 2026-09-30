"""
Live integration test for the _download_all_large_content_csv background
task (backend/search/tasks.py), the emailed-zip-download path used for
queries too large for the synchronous download-all-content-csv endpoint
(see the frontend's sendTotalAttentionDataEmail / send-email-large-download-csv).

Skipped unless RUN_INTEGRATION_TESTS=1 is set (CI never sets it, so this
never runs there). No mocking of mc_providers -- the task runs a real
provider.all_items() query against the real ES backend for a real, high
volume source (nytimes.com), builds a real CSV + zip from the results,
and "sends" it as a real email attachment. Runs against the normal
local/scratch Postgres test database.

    RUN_INTEGRATION_TESTS=1 python manage.py test backend.search.integration_tests.test_live_large_csv_email

send_zipped_large_download_email (util/send_emails.py) no-ops unless
EMAIL_HOST is set, and even then hands the actual EmailMessage.send() off
to a fire-and-forget background thread (EmailThread) rather than the one
running this test. util.send_emails reads EMAIL_HOST via `from settings
import EMAIL_HOST` (a one-time value import at module load, not a live
`django.conf.settings` lookup), so django.test.override_settings has no
effect on it -- this patches util.send_emails.EMAIL_HOST directly for the
duration of the test instead (Django's test runner already forces
EMAIL_BACKEND to the in-memory locmem backend, so nothing is actually
sent over the network), and polls mail.outbox with a wall-clock deadline
rather than asserting immediately, since the send happens on another
thread.

NOTE: EmailMessage.recipients() filters out falsy addresses
(`[e for e in (self.to + self.cc + self.bcc) if e]`), and EmailMessage.send()
no-ops entirely (never touches the backend, never appends to mail.outbox)
if recipients() is empty -- so the test user below MUST be given a real,
non-empty email, or the send silently vanishes with no exception anywhere.
"""
import datetime as dt
import time
import zipfile
from io import BytesIO
from unittest.mock import patch

from django.contrib.auth.models import User
from django.core import mail
from django.test import TestCase

from backend.search.tasks import _download_all_large_content_csv
from backend.sources.models import Source
from backend.users.models import Profile
from backend.util.integration_test_utils import skip_unless_live_integration

SOURCE_ID = 1
DOMAIN = "nytimes.com"
MAIL_OUTBOX_TIMEOUT_SECONDS = 120


@skip_unless_live_integration
class LiveLargeCsvEmailTest(TestCase):

    def setUp(self):
        self.source = Source.objects.create(
            id=SOURCE_ID, name=DOMAIN, homepage=f"https://{DOMAIN}",
            platform=Source.SourcePlatforms.ONLINE_NEWS)

        self.user = User.objects.create_user(
            username="zzz_integration_test_csv_email", password="pw", is_staff=True,
            email="zzz_integration_test_csv_email@example.com")
        Profile.objects.create(user=self.user, verified_email=True, quota_mediacloud=1000)

        end_date = dt.date.today()
        start_date = end_date - dt.timedelta(days=30)
        self.query_state = [{
            "platform": "onlinenews-mediacloud",
            "query": "robot*",
            "collections": [],
            "sources": [str(SOURCE_ID)],
            "startDate": start_date.strftime("%Y-%m-%d"),
            "endDate": end_date.strftime("%Y-%m-%d"),
        }]

    @patch("util.send_emails.EMAIL_HOST", "localhost")  # just needs to be truthy
    def test_large_csv_download_emails_real_zip_of_real_stories(self):
        _download_all_large_content_csv.now(
            self.query_state, self.user.id, self.user.is_staff, self.user.email)

        # EmailThread sends on another thread; give up after a bounded
        # wall-clock deadline rather than waiting indefinitely.
        deadline = time.monotonic() + MAIL_OUTBOX_TIMEOUT_SECONDS
        while not mail.outbox and time.monotonic() < deadline:
            time.sleep(0.2)

        self.assertEqual(
            len(mail.outbox), 1,
            f"no email appeared in mail.outbox within {MAIL_OUTBOX_TIMEOUT_SECONDS}s")
        message = mail.outbox[0]
        self.assertEqual(message.to, [self.user.email])
        self.assertEqual(len(message.attachments), 1)

        filename, content, mimetype = message.attachments[0]
        self.assertTrue(filename.endswith(".zip"))
        with zipfile.ZipFile(BytesIO(content)) as zf:
            names = zf.namelist()
            self.assertEqual(len(names), 1)
            csv_bytes = zf.read(names[0])

        rows = csv_bytes.decode().splitlines()
        # header row plus at least one real story row
        self.assertGreater(len(rows), 1)
