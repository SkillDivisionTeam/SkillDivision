# ==========================================
# SkillDivision Telegram Bot Dockerfile
# Base: Python 3.11.9
# Дата обновления: Декабрь 2024
# ==========================================

FROM python:3.11.9-slim

WORKDIR /app

# Копируем зависимости
COPY requirements.txt .

# Устанавливаем зависимости
RUN pip install --no-cache-dir -r requirements.txt

# Копируем код бота
COPY . .

# Запускаем бота
CMD ["python", "bot.py"]