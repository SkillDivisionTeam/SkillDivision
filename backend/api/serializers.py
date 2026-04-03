from django.contrib.auth.models import User
from rest_framework import serializers

from .models import Event, Question, QuizResult


class UserSerializer(serializers.ModelSerializer):
    role = serializers.CharField(source="profile.role", read_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "email", "role"]


class EventSerializer(serializers.ModelSerializer):
    participants_count = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = "__all__"

    def get_participants_count(self, obj: Event) -> int:
        # Считаем уникальных участников
        qs = QuizResult.objects.filter(event=obj)
        return int(qs.values("user").distinct().count())


class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ["id", "text", "options", "correct_index", "topic"]


class LeaderboardSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username")

    class Meta:
        model = QuizResult
        fields = ["username", "score", "max_score", "completed_at"]
