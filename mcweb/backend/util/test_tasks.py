from django.contrib.auth.models import User
from django.test import TestCase
from django.utils import timezone

from background_task.models import CompletedTask, Task

from .tasks import _serialize_task, get_completed_tasks


class SerializeTaskTest(TestCase):
    """
    _serialize_task backs return_task/get_completed_tasks/get_pending_tasks
    -- it's a plain dict comprehension over a model instance's __dict__, but
    had no direct test confirming datetime fields are ISO-formatted and
    Django's private _state isn't leaked.
    """

    def test_datetime_fields_are_isoformatted_and_private_state_excluded(self):
        user = User.objects.create_user(username="serialize_task_user", password="pw")
        task = Task.objects.new_task("some.task.name", creator=user, verbose_name="a task")
        task.save()

        serialized = _serialize_task(task)

        self.assertEqual(serialized["run_at"], task.run_at.isoformat())
        self.assertEqual(serialized["task_name"], "some.task.name")
        self.assertNotIn("_state", serialized)


class GetCompletedTasksTest(TestCase):
    """get_completed_tasks (used by SourcesViewSet.completed_tasks) had no test."""

    def setUp(self):
        self.user_a = User.objects.create_user(username="completed_tasks_user_a", password="pw")
        self.user_b = User.objects.create_user(username="completed_tasks_user_b", password="pw")
        self.task_a = CompletedTask.objects.create(
            task_name="task.for.a", task_params="[[], {}]", task_hash="hash-a",
            run_at=timezone.now(), creator=self.user_a)
        self.task_b = CompletedTask.objects.create(
            task_name="task.for.b", task_params="[[], {}]", task_hash="hash-b",
            run_at=timezone.now(), creator=self.user_b)

    def test_filters_to_the_given_user(self):
        result = get_completed_tasks(self.user_a)
        names = [t["task_name"] for t in result["completed_tasks"]]
        self.assertEqual(names, ["task.for.a"])

    def test_no_user_returns_all(self):
        result = get_completed_tasks(None)
        names = {t["task_name"] for t in result["completed_tasks"]}
        self.assertEqual(names, {"task.for.a", "task.for.b"})
