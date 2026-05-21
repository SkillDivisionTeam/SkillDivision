#!/bin/bash
# =============================================================
# Скрипт восстановления PostgreSQL из резервной копии
# Использование: ./scripts/restore-db.sh <путь_к_файлу.sql.gz>
# =============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="${PROJECT_DIR}/docker-compose.prod.yml"

if [ $# -eq 0 ]; then
    echo "Использование: $0 <путь_к_бэкапу.sql.gz>"
    echo ""
    echo "Доступные бэкапы:"
    ls -lh "${PROJECT_DIR}/backups/"*.sql.gz 2>/dev/null || echo "  Бэкапы не найдены"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Ошибка: файл '$BACKUP_FILE' не найден"
    exit 1
fi

if [ -f "${PROJECT_DIR}/.env" ]; then
    # shellcheck disable=SC1091
    source "${PROJECT_DIR}/.env"
fi

DB_NAME="${POSTGRES_DB:-skilldivision}"
DB_USER="${POSTGRES_USER:-postgres}"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Восстановление БД ${DB_NAME} из ${BACKUP_FILE}..."
echo "ВНИМАНИЕ: существующие данные будут перезаписаны. Продолжить? [y/N]"
read -r confirm
if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
    echo "Отменено."
    exit 0
fi

gunzip -c "$BACKUP_FILE" | docker compose -f "$COMPOSE_FILE" exec -T db \
    psql -U "$DB_USER" "$DB_NAME"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Восстановление завершено."
