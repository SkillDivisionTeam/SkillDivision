from rest_framework import viewsets, status, views
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.decorators import action
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from django.db import models
from django.db.models import Avg
from .models import Event, QuizResult, Profile
from .serializers import (
    EventSerializer,
    QuestionSerializer,
    LeaderboardSerializer,
    UserSerializer,
)
import random


class BotAuthView(views.APIView):
    """
    Авторизация/Регистрация для бота.
    """

    def post(self, request):
        tg_id = request.data.get("tg_id")
        username = request.data.get("username")

        if not tg_id:
            return Response(
                {"error": "tg_id required"}, status=status.HTTP_400_BAD_REQUEST
            )

        profile = Profile.objects.filter(tg_id=tg_id).first()

        if profile:
            user = profile.user
            # Обновляем юзернейм если изменился
            if username and user.username != username:
                # Простая проверка, чтобы не занять чужой ник
                if not User.objects.filter(username=username).exists():
                    user.username = username
                    user.save()
        else:
            safe_username = username if username else f"user_{tg_id}"
            if User.objects.filter(username=safe_username).exists():
                safe_username = f"{safe_username}_{tg_id}"

            user = User.objects.create_user(username=safe_username)
            Profile.objects.create(user=user, tg_id=tg_id, role="participant")

        return Response(UserSerializer(user).data)


class BotProfileView(views.APIView):
    """
    Возвращает карточку участника для бота
    """

    def get(self, request, tg_id):
        try:
            profile = Profile.objects.get(tg_id=tg_id)
            user = profile.user

            # Считаем статистику
            results = QuizResult.objects.filter(user=user)
            total_score = results.aggregate(models.Sum("score"))[
                "score__sum"] or 0
            games_played = results.count()

            # Лучшее место (простая реализация для MVP)
            # В реальном проде это сложный SQL запрос, тут упростим
            # best_rank = "-"

            return Response(
                {
                    "username": user.username,
                    "role": profile.role,
                    "total_score": total_score,
                    "games_played": games_played,
                    "date_joined": user.date_joined.strftime("%d.%m.%Y"),
                }
            )
        except Profile.DoesNotExist:
            return Response({"error": "Profile not found"}, status=404)


class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all().order_by("-date")
    serializer_class = EventSerializer

    @action(detail=True, methods=["get"])
    def questions(self, request, pk=None):
        """Возвращает вопросы для квиза"""
        event = self.get_object()
        questions = list(event.questions.all())
        selected = random.sample(questions, k=min(len(questions), 5))
        return Response(QuestionSerializer(selected, many=True).data)

    @action(detail=True, methods=["get"])
    def stats(self, request, pk=None):
        """
        Главный эндпоинт аналитики для Frontend (Dashboard)
        """
        event = self.get_object()
        results = QuizResult.objects.filter(event=event)

        # 1. Основные счетчики
        total_participants = results.values("user").distinct().count()
        # Для MVP считаем "активными" тех, кто сдавал, т.к. веб-сокетов пока нет
        active_participants = total_participants

        avg_score_agg = results.aggregate(Avg("score"))
        average_score = round(avg_score_agg["score__avg"] or 0, 1)

        # 2. Таблица лидеров (Топ 5)
        # Берем лучший результат для каждого юзера
        top_results = results.order_by("-score")[:10]
        leaderboard_data = []
        # Убираем дубликаты юзеров в коде (в идеале делать через Distinct On в Postgres, но так проще для начала)
        seen_users = set()
        for r in top_results:
            if r.user.id not in seen_users:
                leaderboard_data.append(
                    {"username": r.user.username, "score": r.score})
                seen_users.add(r.user.id)

        # 3. Распределение навыков (Junior/Middle/Senior)
        # Допустим, макс балл 25.
        # 0-10: Junior, 11-20: Middle, 21-25: Senior
        junior = results.filter(score__lte=10).count()
        middle = results.filter(score__gt=10, score__lte=20).count()
        senior = results.filter(score__gt=20).count()

        skill_distribution = [
            {"name": "Junior", "value": junior},
            {"name": "Middle", "value": middle},
            {"name": "Senior", "value": senior},
        ]

        # 4. Лента активности (последние 5 действий)
        recent_activity = results.order_by("-completed_at")[:5]
        activity_log = []
        for r in recent_activity:
            activity_log.append(
                {
                    "time": r.completed_at.strftime("%H:%M"),
                    "message": f"@{r.user.username} набрал {r.score} очков",
                }
            )

        data = {
            "active_participants": active_participants,
            "total_participants": total_participants,
            "average_score": average_score,
            "leaderboard": leaderboard_data[:5],
            "skill_distribution": skill_distribution,
            "activity_log": activity_log,
        }
        return Response(data)

    @action(detail=True, methods=["get"])
    def leaderboard(self, request, pk=None):
        """Топ игроков по конкретному ивенту (для Бота)"""
        event = self.get_object()
        # Берем топ-10 результатов
        results = QuizResult.objects.filter(
            event=event).order_by("-score")[:10]
        serializer = LeaderboardSerializer(results, many=True)
        return Response(serializer.data)


class ResultView(views.APIView):
    def post(self, request):
        """Прием результатов от Бота"""
        user_id = request.data.get("user_id")  # Это ID Django юзера
        # Бот может прислать код ивента
        event_code = request.data.get("event_code")
        score = request.data.get("score")
        max_score = request.data.get("max_score", 25)

        # Если пришел tg_id вместо user_id, пробуем найти
        tg_id = request.data.get("tg_id")
        if tg_id and not user_id:
            try:
                profile = Profile.objects.get(tg_id=tg_id)
                user = profile.user
            except Profile.DoesNotExist:
                return Response({"error": "User not found"}, status=404)
        else:
            user = get_object_or_404(User, pk=user_id)

        # Ищем ивент по коду или ID
        event_id = request.data.get("event_id")
        if event_id:
            event = get_object_or_404(Event, pk=event_id)
        elif event_code:
            event = get_object_or_404(Event, event_code=event_code)
        else:
            # Fallback: берем последний активный
            event = Event.objects.filter(is_active=True).first()
            if not event:
                return Response({"error": "No active event"}, status=404)

        # Сохраняем результат
        QuizResult.objects.create(
            user=user, event=event, score=score, max_score=max_score
        )

        return Response({"status": "saved"})


class CustomAuthToken(ObtainAuthToken):
    """
    Кастомная авторизация: возвращает токен + данные пользователя (роль, ID)
    """

    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        token, created = Token.objects.get_or_create(user=user)

        # Получаем или создаем профиль, если его нет (для суперюзеров)
        profile, _ = Profile.objects.get_or_create(
            user=user, defaults={"role": "admin"}
        )

        return Response(
            {
                "token": token.key,
                "user_id": user.pk,
                "username": user.username,
                "email": user.email,
                "role": profile.role,
            }
        )
