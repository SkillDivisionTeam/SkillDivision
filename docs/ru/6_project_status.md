# Статус проекта Skill Division

**Обновлено:** 24.05.2026
**Назначение:** живой документ о текущем состоянии MVP. Обновлять при закрытии задач или перед созвонами команды.

> Заменяет устаревшие AI-аудиты из `docs/en/audit/` (удалены). Все пункты ниже сверены с кодом репозитория.

---

## Что уже работает

| Область | Статус |
|---------|--------|
| Продукт | 4 компонента: backend, frontend, bot, PostgreSQL |
| Инфраструктура | Docker dev/prod, Nginx, Gunicorn, GitHub Actions (4 workflow), pre-commit |
| Документация | Концепт, структура, функц. спека, тест-спека, deployment guide |
| Backend | Модели, REST API, аналитика (stats, leaderboard), интеграция с ботом, token auth (зачаток) |
| Frontend | React SPA, dashboard с Recharts, auth, CRUD событий, реальный `api.ts` |
| Bot | Регистрация, solo/AI/duel квизы, GigaChat, thin client через API (~480 строк) |
| Тесты | 4 smoke-теста backend в CI; frontend/bot автотестов нет |

---

## Спецификация vs реализация (MVP)

Таблица для **общей части ВКР** — снимает вопросы комиссии «где обещанное?».

| Функция | Спека / UI | Реализация | Статус |
|---------|------------|------------|--------|
| Telegram-бот: регистрация, квиз, дуэли | ✅ | ✅ | **Реализовано** |
| AI-генерация вопросов (GigaChat) | ✅ | ✅ в боте | **Реализовано** |
| Веб: создание мероприятий, аналитика | ✅ | ✅ | **Реализовано** |
| Token authentication | ✅ | ✅ частично | **Частично** — есть, но `AllowAny` на API |
| Лидерборд, stats | ✅ | ✅ | **Реализовано** |
| CSV/Excel экспорт | ✅ в спеке и Landing | ❌ заглушка `alert()` | **Не реализовано** |
| AI на вебе (Gemini) | заявлено | прототип на клиенте | **Частично** — риск безопасности |
| Сегментация по отделам | ✅ в спеке | ❌ | **Не реализовано** |
| OpenAPI / Swagger | drf-yasg в requirements | ❌ эндпоинта нет | **Не реализовано** |
| Server-side валидация ответов квиза | подразумевается | ❌ | **Не реализовано** |
| SSL / HTTPS в prod | желательно | ❌ только HTTP :80 | **Не в MVP** |
| Мониторинг (Prometheus и т.п.) | в перспективе | ❌ | **Не в MVP** |

**Формулировка для защиты:** «MVP 1 — рабочий прототип для IT-квизов на мероприятиях; расширенная аналитика, экспорт и enterprise-безопасность — в roadmap MVP 2».

---

## Критичные риски (кросс-командные)

| # | Проблема | Где | Риск на защите | Владелец |
|---|----------|-----|----------------|----------|
| 1 | `AllowAny` на всех эндпоинтах | `backend/skill_division/settings.py` | «Где безопасность?» | Backend |
| 2 | При веб-логине auto `role: admin` | `backend/api/views.py` → `CustomAuthToken` | «Любой пользователь = админ» | Backend |
| 3 | `correct_index` в публичном API | `backend/api/serializers.py` | Читинг в квизе | Backend |
| 4 | Нет валидации score на сервере | `POST /api/submit-score/` | Накрутка очков | Backend |
| 5 | CSV — заглушка, но обещан в UI | `frontend/pages/EventDetails.tsx`, `Landing.tsx` | «Обманули в спеке?» | Frontend + общая часть |
| 6 | Gemini API key на клиенте | `frontend/services/geminiService.ts` | Вопрос по безопасности | Frontend (+ Backend) |
| 7 | Состояние дуэлей in-memory | `bot/bot.py` | Потеря сессий после рестарта | Bot |
| 8 | `verify_ssl_certs=False` у GigaChat | `bot/bot.py` | Слабое место по безопасности | Bot |
| 9 | Тест-спека заполнена, автотестов мало | `docs/ru/4_test_specification.md` vs код | «Где тестирование?» | Все |

---

## Статус по ролям

### Backend

**Материала для диплома достаточно:** API, модели, аналитика, интеграция с ботом.

Сильные стороны: `Event`, `Question`, `Profile`, `QuizResult`; ViewSet + stats/leaderboard; `bot-auth`, `submit-score`.

До защиты желательно:

- permissions вместо `AllowAny` (хотя бы на write-эндпоинтах);
- убрать `correct_index` из публичного сериализатора;
- server-side проверка score (или явно в «ограничениях MVP»);
- 10–15 unit-тестов (serializers, views) — сценарии уже в `4_test_specification.md` §5.2, 5.5;
- OpenAPI через drf-yasg **или** убрать из claims;
- CSV export API **или** согласовать с frontend снятие с UI.

### Frontend

**Материала достаточно:** UX/UI, SPA, REST, визуализация данных.

Сильные стороны: React + TS + Tailwind; `EventDetails` с живой аналитикой; реальный `api.ts`.

До защиты желательно:

- CSV: минимальная реализация **или** убрать кнопку и правки в Landing;
- Gemini: перенос на backend **или** описать как прототип с риском;
- 2–3 Vitest-теста (логин, dashboard);
- скриншоты для БКР: Events, EventDetails, CreateEvent.

### Bot

**Материала достаточно:** thin client, solo/AI/duel, GigaChat.

Сильные стороны: полный user flow через API; архитектура «тонкий клиент» хорошо ложится в текст.

До защиты желательно:

- 5–8 pytest с mock API (регистрация, парсер GigaChat, очередь дуэлей);
- раздел «ограничения MVP»: in-memory state, таймер дуэли vs 10 сек из спеки;
- `verify_ssl_certs=True`;
- согласовать с backend server-side проверку ответов (хотя бы в планах).

### DevOps

**Инфра готова, текст диплома в работе.**

Есть: docker-compose dev/prod, Nginx, 4 CI workflow, pre-commit, gitleaks, backup-скрипт, smoke-тесты в CI.

---

## Приоритеты до защиты (2–3 недели)

1. **Backend:** permissions + убрать `correct_index` из публичного API.
2. **Каждый:** минимальные автотесты в своей зоне.
3. **CSV:** реализовать или честно снять с UI и презентации.
4. **Общая часть:** финализировать таблицу «спека vs реализация» (см. выше).
5. **Команда:** согласовать 5–7-минутный сценарий демо на защиту.

---

## Связанные документы

- [Готовность к диплому (шпаргалка)](diploma_readiness.md)
- [Функциональная спецификация](3_func_specification.md)
- [Спецификация тестов](4_test_specification.md)
- [Руководство по развёртыванию](5_deployment.md)
