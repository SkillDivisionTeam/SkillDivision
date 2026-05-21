import django
from django.conf import settings


def pytest_configure() -> None:
    """Настройка Django для pytest без внешнего DJANGO_SETTINGS_MODULE."""
    if not settings.configured:
        import os

        os.environ.setdefault("DJANGO_SETTINGS_MODULE", "skill_division.settings")
        django.setup()
