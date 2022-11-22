from django.core.management.base import BaseCommand, CommandError
import os
import csv
import dateparser
from django.contrib.auth.models import User
from django.utils.timezone import make_aware
from ...models import Profile


class Command(BaseCommand):
    help = 'Adds users from a CSV dump file you pass in'

    def add_arguments(self, parser):
        parser.add_argument('file_path')

    def handle(self, *args, **options):
        file_path = options['file_path']
        self.stdout.write(self.style.SUCCESS('Importing from "%s"' % file_path))

        # validate inputs
        if not os.path.exists(file_path):
            raise CommandError("Can't find file %s" % file_path)

        # wipe and existing non-super users
        self.stdout.write(self.style.SUCCESS('Importing users'))
        User.objects.filter(is_superuser=False).delete()

        # import new users
        with open(file_path) as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                u = User()
                u.email = row['email']
                u.username = row['email']
                u.is_active = row['active'] == 't'
                u.first_name = row['full_name'].split(' ')[0]
                u.last_name = ' '.join(row['full_name'].split(' ')[1:])
                u.date_joined = make_aware(dateparser.parse(row['created_date']))
                u.save()
                p = Profile()
                p.user = u
                p.notes = row['notes']
                p.has_consented = row['has_consented']
                p.was_imported = True
                p.imported_password_hash = row['password_hash']
                p.save()
                n += 1
        self.stdout.write(self.style.SUCCESS('Done'))
