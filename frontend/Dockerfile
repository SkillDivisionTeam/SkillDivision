FROM node:20.11-alpine

WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем весь код
COPY . .

# Открываем порт
EXPOSE 3000

# Запускаем dev-сервер
CMD ["npm", "run", "dev"]
