import datetime as dt
from unittest.mock import MagicMock, patch

from django.test import TestCase
from django.utils import timezone

from background_task.models import Task
from settings import SYSTEM_TASK_USERNAME

from ..models import ResetCodes, User
from .. import tasks as reset_tasks


class CleanupResetCodesEntryPointTest(TestCase):
    """cleanup_reset_codes() schedules _cleanup_reset_codes as a background
    task under the system-task user; had no coverage."""

    def test_schedules_a_task_for_the_system_task_user(self):
        result = reset_tasks.cleanup_reset_codes(days=3)

        system_user = User.objects.get(username=SYSTEM_TASK_USERNAME)
        task = Task.objects.get(task_name="backend.users.tasks._cleanup_reset_codes")
        self.assertEqual(task.creator_object_id, system_user.id)
        self.assertIn("cleanup reset codes", task.verbose_name)
        self.assertEqual(result["task"]["task_name"], "backend.users.tasks._cleanup_reset_codes")


class CleanupResetCodesTaskTest(TestCase):
    """_cleanup_reset_codes (the actual background-task body) had no direct
    coverage of its deletion/cutoff logic."""

    def _create_reset_code(self, *, age_days: int) -> ResetCodes:
        code = ResetCodes.objects.create(email="reset@example.com", token=f"token-{age_days}")
        ResetCodes.objects.filter(pk=code.pk).update(
            created_at=timezone.now() - dt.timedelta(days=age_days))
        return code

    def test_deletes_only_codes_older_than_the_cutoff(self):
        old_code = self._create_reset_code(age_days=5)
        recent_code = self._create_reset_code(age_days=0)

        reset_tasks._cleanup_reset_codes.now(days=1)

        self.assertFalse(ResetCodes.objects.filter(pk=old_code.pk).exists())
        self.assertTrue(ResetCodes.objects.filter(pk=recent_code.pk).exists())

    def test_no_old_codes_is_a_no_op_not_an_error(self):
        recent_code = self._create_reset_code(age_days=0)

        reset_tasks._cleanup_reset_codes.now(days=1)  # should not raise

        self.assertTrue(ResetCodes.objects.filter(pk=recent_code.pk).exists())

    def test_deletion_error_is_logged_and_reraised(self):
        self._create_reset_code(age_days=5)

        mock_queryset = MagicMock()
        mock_queryset.count.return_value = 1
        mock_queryset.delete.side_effect = Exception("boom")

        with patch.object(reset_tasks.ResetCodes, "objects") as mock_manager:
            mock_manager.filter.return_value = mock_queryset
            with self.assertRaisesMessage(Exception, "boom"):
                reset_tasks._cleanup_reset_codes.now(days=1)
