from django.core.management.base import BaseCommand
import logging
from settings import SYSTEM_TASK_USERNAME
from ...tasks import cleanup_reset_codes

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Delete reset codes older than one day'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=1,
            help='Number of days to keep reset codes (default: 1)',
        )

    def handle(self, *args, **options):
        logger.info(f"Starting delete-reset-tokens command (days={options['days']}), SYSTEM_TASK_USERNAME={SYSTEM_TASK_USERNAME}")
        cleanup_reset_codes(days=options['days'])
