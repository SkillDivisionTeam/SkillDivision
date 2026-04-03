# ==========================================
# SkillDivision Telegram Bot Dockerfile
# Base: Python 3.11.9

# Базовый образ Python
FROM python:3.11.9-slim
# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем зависимости
COPY requirements.txt .

# Устанавливаем зависимости
RUN pip install --no-cache-dir -r requirements.txt

# Копируем весь код бота
COPY . .

# Запускаем бота
CMD ["python", "bot.py"]
