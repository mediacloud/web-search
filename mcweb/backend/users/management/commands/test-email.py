from django.core.management.base import BaseCommand
from django.core.mail import send_mail
from django.contrib.auth.models import User

from settings import EMAIL_HOST, EMAIL_HOST_USER, EMAIL_NOREPLY, EMAIL_ORGANIZATION
from util.send_emails import send_rescrape_email

class Command(BaseCommand):
    help = 'send a test email'

    def add_arguments(self, parser):
        # to allow variation when sending multiple messages:
        parser.add_argument("--subject", "-s", default="test-email")

        # required: one or more recipents:
        parser.add_argument("recipients", nargs="+")

    def handle(self, *args, **options):
        if not EMAIL_HOST:
            print("EMAIL_HOST not set")
            return 1

        if EMAIL_HOST_USER != EMAIL_NOREPLY:
            print(f"NOTE!!!! EMAIL_HOST_USER ({EMAIL_HOST_USER}) != EMAIL_NOREPLY ({EMAIL_NOREPLY})")

        # from send_rescrape_email
        cmdline_subject = options["subject"]
        subject = f"[{EMAIL_ORGANIZATION}] {cmdline_subject}"
        recip = options["recipients"]
        header_from = EMAIL_NOREPLY
        body = "testing\n1\n2\n3\n"
        print("subject", subject)
        print("header_from", header_from)
        print("recipents", recip)

        ret = send_mail(subject, body, header_from, recip, fail_silently=False)
        print("send_mail returned", ret)
        return ret < 1          # error (non-zero) status if no msgs sent
