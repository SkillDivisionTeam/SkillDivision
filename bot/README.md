Создание образа:

```
docker build -t quiz-bot .
```

Запуск образа:

```
docker run -d --name quiz-bot --restart unless-stopped quiz-bot
```

Остановка образа:

```
docker stop quiz-bot
```
