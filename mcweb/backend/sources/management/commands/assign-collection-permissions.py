from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth.models import User
from ....sources.models import Collection
from guardian.shortcuts import assign_perm

class Command(BaseCommand):
    help = 'Assigns collection permissions to a user'

    def add_arguments(self, parser):
        parser.add_argument('email', type=str)
        parser.add_argument('collection_id', type=int)

    def handle(self, *args, **options):
        email = options['email']
        collection_id = options['collection_id']

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise CommandError(f'User "{email}" does not exist')

        try:
            collection = Collection.objects.get(pk=collection_id)
        except Collection.DoesNotExist:
            raise CommandError(f'Collection with id {collection_id} does not exist')

        assign_perm('edit_collection', user, collection)

        self.stdout.write(self.style.SUCCESS(
            f'Successfully assigned permissions to {email} for collection {collection_id}'
        ))