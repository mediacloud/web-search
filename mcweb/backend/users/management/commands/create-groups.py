from django.core.management import BaseCommand
from django.contrib.auth.models import User, Group , Permission
from django.conf import settings
import logging

# credit to SO user VMMF for this function https://stackoverflow.com/questions/22250352/programmatically-create-a-django-group-with-permissions

class Command(BaseCommand):

    help = "Creates default permission groups for contributors"

    def add_options(self, parser):
        parser.add_argument("--add-all",
                            action="store_true",
                            help="Add all users to groups where configured (skipped by default)"
            )

    def handle(self, *args, **options):

        for group_name in settings.Groups.PERMISSIONS:

            new_group, created = Group.objects.get_or_create(name=group_name)

            # Loop models in group
            for app_model in settings.Groups.PERMISSIONS[group_name]:

                # Loop permissions in group/model
                for permission_name in settings.Groups.PERMISSIONS[group_name][app_model]:

                    # Generate permission name as Django would generate it
                    name = "Can {} {}".format(permission_name, app_model)
                    print("Creating {}".format(name))

                    try:
                        model_add_perm = Permission.objects.get(name=name)
                    except Permission.DoesNotExist:
                        logging.warning("Permission not found with name '{}'.".format(name))
                        continue

                    new_group.permissions.add(model_add_perm)

            #This behavior needs some additional thought- since we don't want actually to add /all/ users to any group ever...
            #(as presumably we've removed users before...)
            for user_email in settings.Groups.DEFAULT_USERS[group_name]:
                if user_email == "all":
                    
                    if options["add-all"]:
                        print("Adding all users to {}".format(new_group))
                        users = User.objects.all()
                        for u in users:
                            new_group.user_set.add(u)
                        
                    else:
                        print(f"Skipping add-all operation for {new_group} (Manually call create-groups with --add-all to run)")
                else:
                    u = User.objects.get(email=user_email)

                    new_group.user_set.add(u)

                    print("Adding {} to {}".format(u,new_group))