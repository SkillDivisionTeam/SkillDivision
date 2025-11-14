# ==========================================
# SkillDivision Frontend Dockerfile
# Base: Node.js 20.11 LTS Alpine
# Дата обновления: Декабрь 2024
# ==========================================

FROM node:20.11-alpine

WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем весь код
COPY . .

# Собираем production build (опционально, для dev режима закомментируйте)
# RUN npm run build

# Открываем порт
EXPOSE 3000

# Запускаем dev-сервер (для production используйте npm start после build)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]