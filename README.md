# SkillDivision

Интерактивная платформа для проведения квизов и оценки участников мероприятий.

![Backend CI](https://github.com/SkillDivisionTeam/SkillDivision/actions/workflows/backend.yml/badge.svg)
![Frontend CI](https://github.com/SkillDivisionTeam/SkillDivision/actions/workflows/frontend.yml/badge.svg)
![Bot CI](https://github.com/SkillDivisionTeam/SkillDivision/actions/workflows/bot.yml/badge.svg)

## Стек технологий

- Django REST Framework (backend)
- React (frontend)
- PostgreSQL (database)
- python-telegram-bot (бот)
- Docker & Docker Compose (контейнеризация)

## Компоненты

- **backend** — API и бизнес-логика
- **frontend** — веб-интерфейс (React + Vite)
- **bot** — Telegram-бот
- **db** — PostgreSQL
- **pgadmin** — веб-интерфейс для управления БД

## Запуск и установка

Для запуска проекта потребуется установленный **Docker** и **Docker Compose**.

### 1. Настройка окружения

В корне проекта создайте файл `.env`. Пример переменных можно посмотреть в `.env.example`.

### 2. Запуск контейнеров

Сборка и запуск всех сервисов в фоновом режиме:

```bash
docker compose up -d --build [имя компонента]
```

### 3. Применение миграций

После первого запуска необходимо применить миграции к базе данных:

```bash
docker compose exec backend python manage.py migrate
```

Создание суперпользователя (для доступа в админку Django):

```bash
docker compose exec backend python manage.py createsuperuser
```

### Доступы к сервисам

После успешного запуска сервисы будут доступны по адресам:

- **Frontend:** [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://localhost:8000](http://localhost:8000)
- **Админка Django:** [http://localhost:8000/admin](http://localhost:8000/admin)
- **pgAdmin:** [http://localhost:5050](http://localhost:5050) (Login: `admin@admin.com`, Pass: `admin`)

### Полезные команды

```bash
# Просмотр логов всех контейнеров
docker compose logs -f

# Просмотр логов конкретного сервиса (например, backend)
docker compose logs -f backend

# Перезапуск отдельного контейнера
docker compose restart frontend

# Остановка проекта
docker compose down
```

> **Примечание:** В проекте настроен Hot Reload для `frontend` и `backend`. Изменения в коде локально автоматически отображаются в контейнерах.

## Документация

- [Концепт Проекта](docs/ru/1_concept.md)
- [Структура Проекта](docs/ru/2_structure.md)
- [Функциональная Спецификация](docs/ru/3_func_specification.md)
- [Спецификации и сценарии тестов](docs/ru/4_test_specification.md)
- [UML диаграммы](docs/ru/images/)

## Google Drive

Ссылка на папку с документами: <https://drive.google.com/drive/folders/1EepPhvueDftvlhvgAVs1j7ydRnUvA3DQ>
