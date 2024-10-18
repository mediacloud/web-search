from django.core.management import BaseCommand
from django.contrib.auth.models import User, Group , Permission
import logging

# credit to SO user VMMF for this function https://stackoverflow.com/questions/22250352/programmatically-create-a-django-group-with-permissions
GROUPS = {
    "contributor": {
        #django app model specific permissions
        "source" : ["add","change","view"],
        "collection" : ["add","change","view"],
        "feed" : ["add","change","view"],     
    },
}


USERS = {
    "contributor" : ["e.leon@northeastern.edu"],
}

class Command(BaseCommand):

    help = "Creates default permission groups for contributors"

    def handle(self, *args, **options):

        for group_name in GROUPS:

            new_group, created = Group.objects.get_or_create(name=group_name)

            # Loop models in group
            for app_model in GROUPS[group_name]:

                # Loop permissions in group/model
                for permission_name in GROUPS[group_name][app_model]:

                    # Generate permission name as Django would generate it
                    name = "Can {} {}".format(permission_name, app_model)
                    print("Creating {}".format(name))

                    try:
                        model_add_perm = Permission.objects.get(name=name)
                    except Permission.DoesNotExist:
                        logging.warning("Permission not found with name '{}'.".format(name))
                        continue

                    new_group.permissions.add(model_add_perm)


            for user_email in USERS[group_name]:
                u = User.objects.get(email=user_email)
                new_group.user_set.add(u)

                print("Adding {} to {}".format(u,new_group))