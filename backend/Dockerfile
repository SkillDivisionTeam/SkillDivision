# ==========================================
# SkillDivision Backend Dockerfile
# Base: Python 3.11.9
# Дата обновления: Декабрь 2024
# ==========================================

# Используем официальный образ Python 3.11.9 (slim — облегчённая версия)
FROM python:3.11.9-slim

# Устанавливаем рабочую директорию внутри контейнера
WORKDIR /app

# Устанавливаем системные зависимости для PostgreSQL клиента
# (нужны для работы psycopg2 — драйвера для PostgreSQL)
RUN apt-get update && apt-get install -y \
    postgresql-client \
    gcc \
    python3-dev \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Копируем файл зависимостей
# (делаем это ДО копирования всего кода для кеширования слоёв Docker)
COPY requirements.txt .

# Устанавливаем Python-зависимости
RUN pip install --no-cache-dir -r requirements.txt

# Копируем весь код проекта в контейнер
COPY . .

# Открываем порт 8000 (на нём работает Django)
EXPOSE 8000

# Команда запуска Django development сервера
# (эта команда переопределяется в docker-compose.yml)
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]