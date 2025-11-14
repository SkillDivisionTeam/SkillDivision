# Спецификация версий SkillDivision

---

## TL;DR

| Что | Версия | Зачем |
|-----|--------|-------|
| Python | **3.11.11** | Быстрая, стабильная, поддержка до 2027 |
| Django | **4.2.16 LTS** | Long Term Support до 2026 |
| PostgreSQL | **14.12** | Оптимальна для малых проектов, поддержка до 2026 |
| Node.js | **20.11 LTS** | Современная LTS с поддержкой до 2026 |
| React | **18.2.0** | Стабильная с Concurrent Features |

---

## Полная спецификация

### Backend (Django + API)

```txt
Python: 3.11.11
Django: 4.2.16
Django REST Framework: 3.14.0
PostgreSQL: 14.12
psycopg2-binary: 2.9.9
django-cors-headers: 4.3.1
python-decouple: 3.8
```

**Docker образ:**

```dockerfile
FROM python:3.11.11-slim
```

---

### Telegram Bot

```txt
Python: 3.11.11
python-telegram-bot: 20.7
requests: 2.31.0
python-decouple: 3.8
```

**Docker образ:**

```dockerfile
FROM python:3.11.11-slim
```

---

### Frontend (React)

```json
{
  "node": "20.11.0",
  "react": "18.2.0",
  "react-dom": "18.2.0",
  "vite": "5.0.8",
  "react-router-dom": "6.20.1"
}
```

**Docker образ:**

```dockerfile
FROM node:20.11-alpine
```

---

### База данных

```yaml
PostgreSQL: 14.12-alpine
pgAdmin: 8.2
```

**Docker образ:**

```yaml
db:
  image: postgres:14.12-alpine

pgadmin:
  image: dpage/pgadmin4:8.2
```

---

## Политика обновлений

### Когда обновлять

| Тип обновления | Пример | Частота | Тестирование |
|----------------|--------|---------|--------------|
| **Патч** | 3.11.9 → 3.11.12 | Сразу при выходе | Минимальное (только критичное) |
| **Минор** | 4.2.16 → 4.3.0 | Каждые 2-3 месяца | Полное на staging |
| **Мажор** | 4.x → 5.x | Только после планирования | Полное + регрессионное |

### Как отслеживать

1. **GitHub Dependabot** — автоматические PR для обновлений
2. **Ежемесячная проверка:** `pip list --outdated`
3. **Подписка на security advisories** критичных пакетов

---

## Что делать при уязвимости

1. Проверить, затрагивает ли она нашу версию
2. Если да — немедленно обновить патч-версию
3. Пересобрать Docker образы: `docker-compose build --no-cache`
4. Протестировать на staging
5. Задеплоить на production

**Пример:**

```bash
# Обнаружена уязвимость в Django 4.2.16
# Вышел патч 4.2.17

# 1. Обновить requirements.txt
Django==4.2.17

# 2. Пересобрать
docker-compose build backend --no-cache

# 3. Тестировать
docker-compose up
```
