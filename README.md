# SkillDivision

Интерактивная платформа для проведения IT-квизов, оценки навыков участников и аналитики мероприятий с поддержкой AI.

![Backend CI](https://github.com/SkillDivisionTeam/SkillDivision/actions/workflows/backend.yml/badge.svg)
![Frontend CI](https://github.com/SkillDivisionTeam/SkillDivision/actions/workflows/frontend.yml/badge.svg)
![Bot CI](https://github.com/SkillDivisionTeam/SkillDivision/actions/workflows/bot.yml/badge.svg)

## Стек технологий

- **Backend:** Python 3.11, Django 5, Django REST Framework (DRF)
- **Frontend:** React, Vite, TypeScript, TailwindCSS
- **Database:** PostgreSQL
- **Bot:** python-telegram-bot (Telebot), архитектура "Тонкий клиент"
- **AI:** GigaChat API (генерация вопросов)
- **Infrastructure:** Docker & Docker Compose, Nginx

## Функциональность

### Telegram-бот (Участник)

- **Регистрация:** Автоматическая синхронизация профиля с базой данных.
- **Одиночная игра:**
  - *Квиз мероприятия:* Вопросы, заданные организатором.
  - *AI Квиз:* Бесконечная генерация уникальных вопросов через GigaChat.
- **PvP Дуэли:** Соревнование с другим участником в реальном времени (по коду комнаты или случайный подбор).
- **Профиль:** Просмотр личной статистики (очки, количество игр, ранг).
- **Инфо:** Просмотр информации о текущем мероприятии и проекте.
- **Лидерборд:** Топ участников текущего ивента.

### Веб-платформа (Организатор/HR)

- **Авторизация:** Безопасный вход (Token Authentication).
- **Управление событиями:** Создание и редактирование мероприятий.
- **Аналитика (Dashboard):**
  - Живая статистика (Active Users).
  - Распределение по грейдам (Junior/Middle/Senior).
  - Лента активности.
- **Таблица лидеров:** Просмотр результатов всех участников.

## Компоненты системы

- **backend** — REST API, бизнес-логика, админка.
- **frontend** — SPA приложение для организаторов.
- **bot** — Интерфейс взаимодействия с участниками.
- **db** — Единая база данных PostgreSQL.

## Запуск и установка

Для запуска проекта потребуется установленный **Docker** и **Docker Compose**.

### 1. Настройка окружения

Создайте файл `.env` в корне проекта (рядом с `docker-compose.yml`).
Пример содержимого:

```env
# Database
POSTGRES_DB=skilldivision
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_HOST=db
POSTGRES_PORT=5432

# Django
DJANGO_SECRET_KEY=super-secret-key
DEBUG=True

# API URLs (Internal Docker Network)
BACKEND_API_URL=http://backend:8000/api

# External Tokens
TG_TOKEN=ваш_телеграм_токен
GIGACHAT_TOKEN=ваш_токен_gigachat
```

Также создайте файл `.env` в папке `frontend`:

```env
VITE_API_URL=http://localhost:8000/api
```

### 2. Запуск контейнеров

Сборка и запуск всех сервисов:

```bash
docker compose up -d --build
```

### 3. Применение миграций и настройка БД

После первого запуска необходимо создать структуры таблиц:

```bash
# Создание миграций для приложения API
docker compose exec backend python manage.py makemigrations api

# Применение миграций
docker compose exec backend python manage.py migrate

# Создание суперпользователя (для входа в админку и на веб-платформу)
docker compose exec backend python manage.py createsuperuser
```

### Доступы к сервисам

После успешного запуска сервисы доступны по адресам:

- **Frontend (Web):** [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://localhost:8000/api/events/](http://localhost:8000/api/events/)
- **Админка Django:** [http://localhost:8000/admin](http://localhost:8000/admin)
- **pgAdmin:** [http://localhost:5050](http://localhost:5050) (Login: `admin@admin.com`, Pass: `admin`)

### Полезные команды

```bash
# Перезапуск отдельного сервиса
docker compose restart *имя сервиса*

# Просмотр логов
docker compose logs -f bot
docker compose logs -f backend

# Остановка проекта
docker compose down
```

## Документация

- [Концепт Проекта](docs/ru/1_concept.md)
- [Структура Проекта](docs/ru/2_structure.md)
- [Функциональная Спецификация](docs/ru/3_func_specification.md)
- [Спецификации и сценарии тестов](docs/ru/4_test_specification.md)

## Google Drive

Ссылка на папку с документами: <https://drive.google.com/drive/folders/1EepPhvueDftvlhvgAVs1j7ydRnUvA3DQ>
