from django.contrib.auth.models import User
from django.db import models


class Profile(models.Model):
    """Расширение стандартного юзера для хранения Telegram ID"""

    ROLES = (
        ("participant", "Участник"),
        ("admin", "Администратор"),
        ("hr", "HR"),
    )
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    tg_id = models.BigIntegerField(unique=True, null=True, blank=True)
    role = models.CharField(max_length=20, choices=ROLES, default="participant")
    avatar = models.URLField(blank=True, null=True)

    def __str__(self) -> str:
        return f"{self.user.username} ({self.role})"


class Event(models.Model):
    title = models.CharField(max_length=200)
    date = models.DateField()
    event_code = models.CharField(max_length=10, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"{self.title} ({self.event_code})"


class Question(models.Model):
    DIFFICULTY = (
        ("easy", "Easy"),
        ("medium", "Medium"),
        ("hard", "Hard"),
    )
    event = models.ForeignKey(
        Event, related_name="questions", on_delete=models.CASCADE, null=True, blank=True
    )
    text = models.TextField()
    options = models.JSONField(
        help_text="Список вариантов ответов ['А', 'Б', 'В', 'Г']"
    )
    correct_index = models.IntegerField(help_text="Индекс правильного ответа (0-3)")
    topic = models.CharField(max_length=100, default="General IT")
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY, default="medium")

    def __str__(self) -> str:
        return f"{self.text[:50]}..."


class QuizResult(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    event = models.ForeignKey(Event, on_delete=models.CASCADE)
    score = models.IntegerField(default=0)
    max_score = models.IntegerField(default=0)
    completed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-score"]
