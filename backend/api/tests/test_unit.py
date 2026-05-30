from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase

from api.models import Event, Profile, Question, QuizResult


class SkillDivisionAPITests(APITestCase):
    def setUp(self) -> None:
        # Создаем суперпользователя (для роли admin)
        self.admin_user = User.objects.create_superuser(
            username="admin",
            password="testpassword123",  # gitleaks:allow
        )

        # Создаем обычного пользователя (для роли hr)
        self.hr_user = User.objects.create_user(
            username="hr_manager",
            password="testpassword123",  # gitleaks:allow
        )

        # Создаем тестовое мероприятие
        self.event = Event.objects.create(
            title="Тестовый Ивент",
            event_code="TEST2025",
            date="2025-12-10",
            is_active=True,
        )

        # Создаем тестовый вопрос
        self.question = Question.objects.create(
            event=self.event,
            text="Что такое Docker?",
            options=["Контейнер", "Браузер", "Язык", "База"],
            correct_index=0,
            topic="DevOps",
        )

    # ==========================================
    # ТЕСТЫ ПРАВ ДОСТУПА (PERMISSIONS) - Сценарий 5.5
    # ==========================================

    def test_1_get_events_anonymous(self) -> None:
        """Аноним может смотреть список мероприятий (GET)"""
        response = self.client.get("/api/events/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_2_create_event_anonymous_forbidden(self) -> None:
        """Аноним НЕ может создавать мероприятия (POST)"""
        data = {"title": "Хакерский Ивент", "event_code": "HACK", "date": "2025-10-10"}
        response = self.client.post("/api/events/", data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_3_create_event_authenticated_success(self) -> None:
        """Авторизованный пользователь (Админ/HR) может создавать мероприятия"""
        self.client.force_authenticate(user=self.admin_user)
        data = {"title": "Новый Ивент", "event_code": "NEW2025", "date": "2025-10-11"}
        response = self.client.post("/api/events/", data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Event.objects.count(), 2)

    # ==========================================
    # ТЕСТЫ ВАЛИДАЦИИ (SERIALIZERS) - Сценарий 5.2
    # ==========================================

    def test_4_event_code_unique_validation(self) -> None:
        """Проверка уникальности event_code"""
        self.client.force_authenticate(user=self.admin_user)
        # Пытаемся создать ивент с кодом "TEST2025" (уже существует)
        data = {"title": "Дубликат", "event_code": "TEST2025", "date": "2025-10-12"}
        response = self.client.post("/api/events/", data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("event_code", response.data)

    def test_5_event_missing_required_fields(self) -> None:
        """Проверка ошибки при отсутствии обязательных полей"""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post("/api/events/", {"title": "Без даты и кода"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # ==========================================
    # ТЕСТЫ БЕЗОПАСНОСТИ (SECURITY)
    # ==========================================

    def test_6_question_serializer_hides_correct_index(self) -> None:
        """Убеждаемся, что correct_index НЕ отдается по API (защита от читов)"""
        response = self.client.get(f"/api/events/{self.event.id}/questions/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        question_data = response.data[0]
        self.assertNotIn(
            "correct_index",
            question_data,
            "УЯЗВИМОСТЬ: Правильный ответ отдается наружу!",
        )
        self.assertIn("options", question_data)

    def test_7_login_assigns_admin_role_for_superuser(self) -> None:
        """Суперпользователю выдается роль 'admin'"""
        response = self.client.post(
            "/api/login/", {"username": "admin", "password": "testpassword123"}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["role"], "admin")

    def test_8_login_assigns_hr_role_for_normal_user(self) -> None:
        """Обычному пользователю выдается роль 'hr'"""
        response = self.client.post(
            "/api/login/", {"username": "hr_manager", "password": "testpassword123"}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["role"], "hr")

    # ==========================================
    # ТЕСТЫ ИНТЕГРАЦИИ С БОТОМ (BOT VIEWS)
    # ==========================================

    def test_9_bot_auth_creates_new_user(self) -> None:
        """Бот может зарегистрировать нового пользователя по tg_id (AllowAny)"""
        data = {"tg_id": 123456789, "username": "tg_player"}
        response = self.client.post("/api/bot-auth/", data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Profile.objects.filter(tg_id=123456789).count(), 1)

    def test_10_bot_auth_missing_tg_id(self) -> None:
        """Ошибка, если бот не прислал tg_id"""
        response = self.client.post("/api/bot-auth/", {"username": "ghost"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_11_submit_score_success(self) -> None:
        """Бот может отправить результаты игры"""
        # Сначала регистрируем
        self.client.post("/api/bot-auth/", {"tg_id": 999, "username": "player1"})

        data = {"tg_id": 999, "event_id": self.event.id, "score": 15, "max_score": 25}
        response = self.client.post("/api/submit-score/", data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(QuizResult.objects.count(), 1)
        self.assertEqual(QuizResult.objects.first().score, 15)

    def test_12_bot_profile_view_returns_stats(self) -> None:
        """Карточка участника для бота возвращает правильную статистику"""
        self.client.post("/api/bot-auth/", {"tg_id": 777, "username": "pro_gamer"})
        self.client.post(
            "/api/submit-score/", {"tg_id": 777, "event_id": self.event.id, "score": 20}
        )
        self.client.post(
            "/api/submit-score/", {"tg_id": 777, "event_id": self.event.id, "score": 10}
        )  # Вторая игра

        response = self.client.get("/api/bot-profile/777/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["games_played"], 2)
        self.assertEqual(response.data["total_score"], 30)

    # ==========================================
    # ТЕСТЫ АНАЛИТИКИ (DASHBOARD VIEWS)
    # ==========================================

    def test_13_event_stats_structure(self) -> None:
        """Проверка структуры дашборда мероприятия"""
        response = self.client.get(f"/api/events/{self.event.id}/stats/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Проверяем наличие всех ключей для фронтенда
        expected_keys = [
            "active_participants",
            "total_participants",
            "average_score",
            "leaderboard",
            "skill_distribution",
            "activity_log",
        ]
        for key in expected_keys:
            self.assertIn(key, response.data)

    def test_14_leaderboard_returns_sorted_data(self) -> None:
        """Лидерборд сортирует игроков по убыванию очков"""
        user1 = User.objects.create_user(username="u1")
        user2 = User.objects.create_user(username="u2")
        QuizResult.objects.create(user=user1, event=self.event, score=10)
        QuizResult.objects.create(user=user2, event=self.event, score=25)

        response = self.client.get(f"/api/events/{self.event.id}/leaderboard/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # На первом месте должен быть u2 (25 очков)
        self.assertEqual(response.data[0]["username"], "u2")
        self.assertEqual(response.data[0]["score"], 25)

    def test_15_bot_profile_not_found(self) -> None:
        """Отработка профиля, если tg_id нет в базе"""
        response = self.client.get("/api/bot-profile/00000/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
