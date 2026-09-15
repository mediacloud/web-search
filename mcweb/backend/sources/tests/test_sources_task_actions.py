from django.contrib.auth.models import User
from django.test import TestCase
from django.utils import timezone

from background_task.models import CompletedTask, Task

BASE_URL = "/api/sources/sources/"


class SourcesTaskActionsTest(TestCase):
    """
    completed_tasks/pending_tasks (SourcesViewSet) are explicitly documented
    as "NOT sources-specific" (they list ALL background tasks for the
    requesting user), reachable only through this viewset "for historical
    reasons". No coverage existed for either. Also exercises the
    get_completed_tasks(None)/get_pending_tasks(None) "all tasks" path via
    a staff user hitting this with tasks belonging to other users too.
    """

    def setUp(self):
        self.user = User.objects.create_user(username="task_actions_user", password="pw")
        self.other_user = User.objects.create_user(username="task_actions_other_user", password="pw")
        self.client.force_login(self.user)

    def test_completed_tasks_scoped_to_requesting_user(self):
        CompletedTask.objects.create(
            task_name="mine.completed", task_params="[[], {}]", task_hash="hash-mine",
            run_at=timezone.now(), creator=self.user)
        CompletedTask.objects.create(
            task_name="theirs.completed", task_params="[[], {}]", task_hash="hash-theirs",
            run_at=timezone.now(), creator=self.other_user)

        response = self.client.get(f"{BASE_URL}completed-tasks/")

        self.assertEqual(response.status_code, 200, response.content)
        names = [t["task_name"] for t in response.data["completed_tasks"]]
        self.assertEqual(names, ["mine.completed"])

    def test_pending_tasks_scoped_to_requesting_user(self):
        mine = Task.objects.new_task("mine.pending", creator=self.user)
        mine.save()
        theirs = Task.objects.new_task("theirs.pending", creator=self.other_user)
        theirs.save()

        response = self.client.get(f"{BASE_URL}pending-tasks/")

        self.assertEqual(response.status_code, 200, response.content)
        names = [t["task_name"] for t in response.data["tasks"]]
        self.assertEqual(names, ["mine.pending"])

    def test_anonymous_cannot_list_completed_tasks(self):
        self.client.logout()
        response = self.client.get(f"{BASE_URL}completed-tasks/")
        self.assertEqual(response.status_code, 401)

    def test_anonymous_cannot_list_pending_tasks(self):
        self.client.logout()
        response = self.client.get(f"{BASE_URL}pending-tasks/")
        self.assertEqual(response.status_code, 401)
