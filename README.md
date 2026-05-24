# SkillDivision

Интерактивная платформа для проведения IT-квизов, оценки навыков участников и аналитики мероприятий с поддержкой AI.

![Backend CI](https://github.com/SkillDivisionTeam/SkillDivision/actions/workflows/backend.yml/badge.svg)
![Frontend CI](https://github.com/SkillDivisionTeam/SkillDivision/actions/workflows/frontend.yml/badge.svg)
![Bot CI](https://github.com/SkillDivisionTeam/SkillDivision/actions/workflows/bot.yml/badge.svg)
![Infrastructure CI](https://github.com/SkillDivisionTeam/SkillDivision/actions/workflows/infra.yml/badge.svg)

## Стек технологий

- **Backend:** Python 3.11, Django 5, Django REST Framework (DRF)
- **Frontend:** React, Vite, TypeScript, TailwindCSS
- **Database:** PostgreSQL 14
- **Bot:** python-telegram-bot (Telebot), архитектура "Тонкий клиент"
- **AI:** GigaChat API (генерация вопросов)
- **Infrastructure:** Docker & Docker Compose, Nginx, Gunicorn, GitHub Actions

## Архитектура развёртывания (production)

```mermaid
flowchart TB
    Internet([Интернет / пользователи])

    subgraph frontend_net["Сеть frontend_net"]
        Nginx["Nginx :80<br/>обратный прокси"]
        Frontend["Frontend<br/>React SPA, nginx :80"]
        Backend["Backend<br/>Django + Gunicorn :8000"]
        Bot["Telegram Bot"]
    end

    subgraph backend_net["Сеть backend_net (internal)"]
        DB[(PostgreSQL :5432)]
    end

    Internet --> Nginx
    Nginx --> |SPA| Frontend
    Nginx --> |API и admin| Backend
    Backend --> DB
    Bot -->|REST API| Backend
    Bot -.->|Telegram API| Internet
```

Подробная документация по развёртыванию: [docs/ru/5_deployment.md](docs/ru/5_deployment.md)

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

Скопируйте шаблон и заполните секреты:

```bash
cp .env.example .env
```

Все сервисы (backend, bot, frontend) читают переменные из одного файла `.env` в корне проекта:

```env
# Database (PostgreSQL)
POSTGRES_DB=skilldivision
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

# Telegram-бот и AI
TG_TOKEN=your-telegram-bot-token
GIGACHAT_TOKEN=your-gigachat-credentials

# Frontend (Vite)
GEMINI_API_KEY=your-gemini-api-key
VITE_API_URL=http://localhost:8000/api
```

При локальном запуске `npm run dev` в папке `frontend` Vite подхватывает корневой `.env` автоматически.

### 2. Запуск контейнеров (разработка)

Сборка и запуск dev-окружения (hot reload, порты 3000/8000, pgAdmin):

```bash
docker compose up -d --build
```

### 3. Запуск production-окружения

Prod: Nginx на порту 80, Gunicorn, собранный фронтенд, БД без внешнего порта.

Перед первым запуском в `.env` для prod задайте:

```env
DJANGO_DEBUG=False
DJANGO_SECRET_KEY=<случайная-длинная-строка>
POSTGRES_PASSWORD=<надёжный-пароль>
VITE_API_URL=/api
CORS_ALLOWED_ORIGINS=http://localhost,http://127.0.0.1
```

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

После запуска:

- **Веб-приложение и API:** [http://localhost](http://localhost) (API: `/api/`)
- **Админка Django:** [http://localhost/admin](http://localhost/admin)

Миграции и суперпользователь — те же команды, с указанием prod-файла:

```bash
docker compose -f docker-compose.prod.yml exec backend python manage.py migrate
docker compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser
```

Остановка prod-стека:

```bash
docker compose -f docker-compose.prod.yml down
```

### 4. Применение миграций и настройка БД (dev)

После первого запуска необходимо создать структуры таблиц:

```bash
# Создание миграций для приложения API
docker compose exec backend python manage.py makemigrations api

# Применение миграций
docker compose exec backend python manage.py migrate

# Создание суперпользователя (для входа в админку и на веб-платформу)
docker compose exec backend python manage.py createsuperuser
```

### Доступы к сервисам (dev)

После успешного запуска `docker compose up`:

- **Frontend (Web):** [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://localhost:8000/api/events/](http://localhost:8000/api/events/)
- **Админка Django:** [http://localhost:8000/admin](http://localhost:8000/admin)
- **pgAdmin:** [http://localhost:5050](http://localhost:5050) (только localhost; логин из `.env`). В pgAdmin хост БД: `db`, порт `5432`.

PostgreSQL с хоста (DBeaver) по умолчанию недоступен — только внутри Docker-сети. Если нужен доступ с машины, в `docker-compose.yml` у сервиса `db` добавьте (на Windows лучше не 5432):

```yaml
ports:
  - "127.0.0.1:5433:5432"
```

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

## Pre-commit хуки

Проект использует [pre-commit](https://pre-commit.com/) для автоматической проверки качества кода перед каждым коммитом.

### Установка

```bash
# Установка pre-commit (если ещё не установлен)
pip install pre-commit

# Установка хуков в репозитории
pre-commit install
```

После установки хуки будут запускаться автоматически при каждом `git commit`.

### Что проверяется

| Хук | Что делает | Применяется к |
|-----|-----------|---------------|
| **trailing-whitespace** | Удаляет пробелы в конце строк | Все файлы |
| **end-of-file-fixer** | Добавляет пустую строку в конец файла | Все файлы |
| **check-yaml** | Проверяет YAML-файлы на синтаксис | `*.yml`, `*.yaml` |
| **check-json** | Проверяет JSON-файлы на синтаксис | `*.json` |
| **check-merge-conflict** | Блокирует коммит с маркерами merge-конфликтов | Все файлы |
| **detect-private-key** | Обнаруживает приватные ключи | Все файлы |
| **check-added-large-files** | Блокирует добавление файлов > 1 МБ | Все файлы |
| **Ruff** | Быстрый линтер и форматирование Python | `backend/`, `bot/` |
| **mypy** | Проверка типов Python | `backend/`, `bot/` |
| **ESLint** | Линтер JavaScript/TypeScript | `frontend/` |
| **tsc --noEmit** | Проверка типов TypeScript | `frontend/` |
| **gitleaks** | Поиск утечек секретов и токенов | Все файлы |
| **markdownlint** | Проверка стиля Markdown | `*.md` |

### Ручной запуск

Для проверки всех файлов вручную:

```bash
pre-commit run --all-files
```

Для проверки конкретного файла:

```bash
pre-commit run --files backend/api/views.py
```

### Пропуск хуков (если очень нужно)

```bash
git commit --no-verify -m "Ваш коммит"
```

> ⚠️ **Внимание:** Используйте `--no-verify` только в крайних случаях. Коммиты, прошедшие без проверки, могут быть отклонены на Code Review.

### Устранение проблем

- **Ruff исправил код:** Если хук Ruff внёс исправления, файл будет изменён. Добавьте исправленный файл снова (`git add`) и повторите коммит.
- **mypy ошибки типов:** Проверьте аннотации типов. Для временного игнорирования используйте `# type: ignore`.
- **gitleaks нашёл утечку:** Немедленно удалите секрет из файла и создайте новый токен/ключ, так как старый считается скомпрометированным.

## Документация

- [Концепт Проекта](docs/ru/1_concept.md)
- [Структура Проекта](docs/ru/2_structure.md)
- [Функциональная Спецификация](docs/ru/3_func_specification.md)
- [Спецификации и сценарии тестов](docs/ru/4_test_specification.md)
- [Руководство по развёртыванию](docs/ru/5_deployment.md)

## Google Drive

Ссылка на папку с документами: <https://drive.google.com/drive/folders/1EepPhvueDftvlhvgAVs1j7ydRnUvA3DQ>
