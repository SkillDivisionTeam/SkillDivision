from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    BotAuthView,
    BotProfileView,
    CustomAuthToken,
    EventViewSet,
    ResultView,
)

router = DefaultRouter()
router.register(r"events", EventViewSet)

urlpatterns = [
    path("", include(router.urls)),
    path("bot-auth/", BotAuthView.as_view(), name="bot-auth"),
    path("submit-score/", ResultView.as_view(), name="submit-score"),
    path("login/", CustomAuthToken.as_view(), name="api_token_auth"),
    path("bot-profile/<int:tg_id>/", BotProfileView.as_view(), name="bot-profile"),
]
