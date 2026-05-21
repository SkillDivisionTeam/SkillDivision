#!/bin/bash
# =============================================================
# Скрипт резервного копирования PostgreSQL для Skill Division
# Использование: ./scripts/backup-db.sh
# Cron (ежедневно в 02:00):
#   0 2 * * * /path/to/project/scripts/backup-db.sh >> /var/log/skilldivision-backup.log 2>&1
# =============================================================

set -euo pipefail

# --- Настройки ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${PROJECT_DIR}/backups"
RETENTION_DAYS=30
COMPOSE_FILE="${PROJECT_DIR}/docker-compose.prod.yml"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Загрузить .env если он есть
if [ -f "${PROJECT_DIR}/.env" ]; then
    # shellcheck disable=SC1091
    source "${PROJECT_DIR}/.env"
fi

DB_NAME="${POSTGRES_DB:-skilldivision}"
DB_USER="${POSTGRES_USER:-postgres}"
BACKUP_FILE="${BACKUP_DIR}/skilldivision_${TIMESTAMP}.sql.gz"

# --- Создать папку для бэкапов ---
mkdir -p "$BACKUP_DIR"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Начало резервного копирования БД ${DB_NAME}..."

# --- Создать дамп и сжать ---
docker compose -f "$COMPOSE_FILE" exec -T db \
    pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_FILE"

BACKUP_SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Бэкап создан: ${BACKUP_FILE} (${BACKUP_SIZE})"

# --- Удалить бэкапы старше RETENTION_DAYS дней ---
DELETED=$(find "$BACKUP_DIR" -name "*.sql.gz" -mtime +"$RETENTION_DAYS" -print -delete | wc -l)
if [ "$DELETED" -gt 0 ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Удалено устаревших бэкапов: ${DELETED}"
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Готово. Бэкапов в хранилище: $(find "$BACKUP_DIR" -name '*.sql.gz' | wc -l)"
