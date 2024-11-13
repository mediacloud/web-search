from django.core.management import call_command
from django.db.models.signals import post_migrate
from django.dispatch import receiver

@receiver(post_migrate)
def run_initialize_config(sender, **kwargs):
    # Run only once after migrations are completed
    call_command("initialize_config")