# mcweb/backend/util
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from django.db import transaction
from .models import ResetCodes, User
import datetime as dt
from settings import SYSTEM_TASK_USERNAME
from backend.util.tasks import (
    SYSTEM_FAST,
    background,
    return_error,
    return_task
)

import logging
logger = logging.getLogger(__name__)


def cleanup_reset_codes(days=1):
    user = User.objects.get(username=SYSTEM_TASK_USERNAME)
    task = _cleanup_reset_codes(days=days,
            creator=user ,
            verbose_name=f"cleanup reset codes {dt.datetime.now()}",
            remove_existing_tasks=True)
    return return_task(task)

@background(queue=SYSTEM_FAST)
def _cleanup_reset_codes(days=1):
    logger.info(f"Starting cleanup_reset_codes command (days={days})")

    cutoff_date = timezone.now() - timedelta(days=days)
    logger.debug(f"Cutoff date calculated: {cutoff_date}")
    
    old_codes = ResetCodes.objects.filter(created_at__lt=cutoff_date)
    count = old_codes.count()
    logger.info(f"Found {count} reset codes older than {days} days")

    if count == 0:
        message = 'No old reset codes found to delete'
        logger.info(message)
        return
    
    try:
        with transaction.atomic():
            deleted_count, deletion_details = old_codes.delete()
            
            logger.info(f"Successfully deleted {deleted_count} reset codes")
            logger.debug(f"Deletion details: {deletion_details}")

    except Exception as e:
        error_message = f'Error deleting old reset codes: {e}'
        logger.error(error_message, exc_info=True) 
        print(error_message)
        return_error(error_message)
        raise
