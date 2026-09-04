from django.core.management.base import BaseCommand
from django.core.mail import send_mail, EmailMessage
from django.contrib.auth.models import User

from util.send_emails import send_rescrape_email

class Command(BaseCommand):
    help = 'TEMP EMAIL TEST'

    def add_arguments(self, parser):
        parser.add_argument('file_path')

    def handle(self, *args, **options):
        #user = User.objects.get(email__exact="phil.budne@gmail.com")
        #send_signup_email(user, None)

        send_rescrape_email("test", "testing", "backend@mediacloud.org", ["phil@ultimate.com"])
        """
        email = EmailMessage(subject="test",
                             body="this is a test",
                             from_email="backend@mediacloud.org",
                             to=["phil@ultimate.com"])

        email.send()
        """
