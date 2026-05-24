# Версии стека Skill Division

Источники правды: `backend/requirements.txt`, `bot/requirements.txt`, `frontend/package.json`, `frontend/package-lock.json`, `docker-compose.yml`, `Dockerfile*`.

Обновлено: май 2026.

---

## TL;DR

| Компонент | Версия | Где зафиксировано |
|-----------|--------|-------------------|
| Python | **3.11.9** | `backend/Dockerfile`, `bot/Dockerfile` |
| Node.js | **20.11** (Alpine) | `frontend/Dockerfile`, `frontend/Dockerfile.prod` |
| PostgreSQL | **14.12-alpine** | `docker-compose.yml` |
| pgAdmin | **8.2** | `docker-compose.yml` |
| Nginx (prod frontend) | **1.25-alpine** | `frontend/Dockerfile.prod` |
| Django | **>=5.0** | `backend/requirements.txt` |
| React | **^18.2.0** (lock: 18.3.1) | `frontend/package.json` / `package-lock.json` |

---

## Backend

**Docker:** `python:3.11.9-slim` (`backend/Dockerfile`, `backend/Dockerfile.prod`)

**`backend/requirements.txt`** (минимальные версии, без lockfile):

```txt
Django>=5.0
djangorestframework>=3.14
psycopg2-binary>=2.9
python-dotenv>=1.0
django-cors-headers>=4.3
gunicorn
drf-yasg
```

При `pip install` ставится последняя версия, удовлетворяющая `>=`.

---

## Telegram Bot

**Docker:** `python:3.11.9-slim` (`bot/Dockerfile`)

**`bot/requirements.txt`** (точные версии):

```txt
pyTelegramBotAPI==4.22.1
gigachat==0.1.21
requests==2.33.1
types-requests==2.33.0.20260402
python-dotenv==1.2.2
```

---

## Frontend

**Docker (dev):** `node:20.11-alpine`
**Docker (prod):** `node:20.11-alpine` → сборка, `nginx:1.25-alpine` → раздача статики

**`frontend/package.json`** — диапазоны:

| Пакет | В `package.json` |
|-------|------------------|
| react / react-dom | ^18.2.0 |
| vite | ^5.0.8 |
| react-router-dom | ^6.30.3 |
| recharts | ^3.5.1 |
| lucide-react | ^0.556.0 |
| @google/genai | ^1.31.0 |
| typescript | ~5.8.2 |
| eslint | ^8.55.0 |
| node (engines) | >=20.11.0 |

**`frontend/package-lock.json`** — что реально ставит `npm ci` (основное):

| Пакет | В lock |
|-------|--------|
| react / react-dom | 18.3.1 |
| vite | 5.4.21 |
| react-router-dom | 6.30.3 |
| recharts | 3.5.1 |
| lucide-react | 0.556.0 |
| @google/genai | 1.31.0 |
| typescript | 5.8.3 |

---

## База данных и инфра

```yaml
# docker-compose.yml
db:
  image: postgres:14.12-alpine

pgadmin:
  image: dpage/pgadmin4:8.2
```

---

## Обновления

1. **Dependabot** — еженедельно, PR в `develop` (см. `.github/dependabot.yml`)
2. **Ручная проверка:** `pip list --outdated` (backend/bot), `npm outdated` (frontend)
3. Перед защитой / релизом — не мерджить deps без необходимости; CI должен быть зелёным

При security-advisory: обновить версию в `requirements.txt` / `package.json`, пересобрать образ:

```bash
docker compose build --no-cache backend
docker compose up -d
```

Пример для Django:

```bash
# requirements.txt: Django>=5.0,<5.1  или конкретный патч
docker compose build backend --no-cache
docker compose up -d
docker compose exec backend python manage.py check
```
