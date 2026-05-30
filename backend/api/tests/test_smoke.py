"""
Smoke-тесты: проверяют, что API поднимается и базовые эндпоинты отвечают.
Не тестируют бизнес-логику — только 200/201/400 и структуру ответа.
"""

from rest_framework.test import APITestCase


class SmokeTests(APITestCase):
    # ──────────────────────────────────────────────
    # GET /api/events/
    # ──────────────────────────────────────────────
    def test_events_list_returns_200(self) -> None:
        """Список мероприятий возвращает 200 и массив."""
        response = self.client.get("/api/events/")
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.json(), list)

    # ──────────────────────────────────────────────
    # POST /api/bot-auth/
    # ──────────────────────────────────────────────
    def test_bot_auth_creates_profile(self) -> None:
        """Регистрация нового пользователя через бота возвращает 200."""
        payload = {"tg_id": 111222333, "username": "test_smoke_user"}
        response = self.client.post("/api/bot-auth/", payload, format="json")
        self.assertEqual(response.status_code, 200)

    def test_bot_auth_missing_tg_id_returns_400(self) -> None:
        """Без tg_id должен вернуть 400."""
        response = self.client.post(
            "/api/bot-auth/", {"username": "no_id"}, format="json"
        )
        self.assertEqual(response.status_code, 400)

    # ──────────────────────────────────────────────
    # POST /api/login/
    # ──────────────────────────────────────────────
    def test_login_wrong_credentials_returns_400(self) -> None:
        """Неверные учётные данные — 400, не 500."""
        response = self.client.post(
            "/api/login/",
            {"username": "nobody", "password": "wrongpass"},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
