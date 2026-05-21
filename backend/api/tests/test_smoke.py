"""
Smoke-тесты: проверяют, что API поднимается и базовые эндпоинты отвечают.
Не тестируют бизнес-логику — только 200/201/400 и структуру ответа.
"""

import pytest
from rest_framework.test import APIClient


@pytest.fixture
def client() -> APIClient:
    return APIClient()


# ──────────────────────────────────────────────
# GET /api/events/
# ──────────────────────────────────────────────


@pytest.mark.django_db
def test_events_list_returns_200(client: APIClient) -> None:
    """Список мероприятий возвращает 200 и массив."""
    response = client.get("/api/events/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


# ──────────────────────────────────────────────
# POST /api/bot-auth/
# ──────────────────────────────────────────────


@pytest.mark.django_db
def test_bot_auth_creates_profile(client: APIClient) -> None:
    """Регистрация нового пользователя через бота возвращает 200."""
    payload = {"tg_id": 111222333, "username": "test_smoke_user"}
    response = client.post("/api/bot-auth/", payload, format="json")
    assert response.status_code == 200


@pytest.mark.django_db
def test_bot_auth_missing_tg_id_returns_400(client: APIClient) -> None:
    """Без tg_id должен вернуть 400."""
    response = client.post("/api/bot-auth/", {"username": "no_id"}, format="json")
    assert response.status_code == 400


# ──────────────────────────────────────────────
# POST /api/login/
# ──────────────────────────────────────────────


@pytest.mark.django_db
def test_login_wrong_credentials_returns_400(client: APIClient) -> None:
    """Неверные учётные данные — 400, не 500."""
    response = client.post(
        "/api/login/",
        {"username": "nobody", "password": "wrongpass"},
        format="json",
    )
    assert response.status_code == 400
