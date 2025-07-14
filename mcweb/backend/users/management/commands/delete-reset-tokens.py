from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from django.db import transaction
from ...models import ResetCodes
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Delete reset codes older than one week'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=7,
            help='Number of days to keep reset codes (default: 7)',
        )

    def handle(self, *args, **options):
        days = options['days']
        logger.info(f"Starting cleanup_reset_codes command (days={days})")

        cutoff_date = timezone.now() - timedelta(days=days)
        logger.debug(f"Cutoff date calculated: {cutoff_date}")
        
        old_codes = ResetCodes.objects.filter(created_at__lt=cutoff_date)
        count = old_codes.count()
        logger.info(f"Found {count} reset codes older than {days} days")

        if count == 0:
            message = 'No old reset codes found to delete'
            logger.info(message)
            self.stdout.write(self.style.SUCCESS(message))
            return
        
        try:
            with transaction.atomic():
                deleted_count, deletion_details = old_codes.delete()
                
                logger.info(f"Successfully deleted {deleted_count} reset codes")
                logger.debug(f"Deletion details: {deletion_details}")

                self.stdout.write(
                    self.style.SUCCESS(
                        f'Successfully deleted {deleted_count} old reset codes'
                    )
                )
                
        except Exception as e:
            error_message = f'Error deleting old reset codes: {e}'
            logger.error(error_message, exc_info=True) 
            self.stdout.write(self.style.ERROR(error_message))
            raise