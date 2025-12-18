import telebot
from telebot import types
import threading
import requests
import random
import string
import os
import logging
import json
import re
from gigachat import GigaChat
from dotenv import load_dotenv

load_dotenv()

# ==================== КОНФИГУРАЦИЯ ====================
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

TOKEN = os.getenv("TG_TOKEN")
GIGACHAT_CREDENTIALS = os.getenv("GIGACHAT_TOKEN")
API_URL = os.getenv("BACKEND_API_URL", "http://backend:8000/api")

bot = telebot.TeleBot(TOKEN)


# ==================== API КЛИЕНТ ====================
def api_register_user(user):
    try:
        username = user.username or f"user_{user.id}"
        payload = {"tg_id": user.id, "username": username}
        requests.post(f"{API_URL}/bot-auth/", json=payload)
    except Exception as e:
        logger.error(f"Reg Error: {e}")


def api_get_active_event():
    try:
        response = requests.get(f"{API_URL}/events/")
        if response.status_code == 200:
            events = response.json()
            for event in events:
                if event.get("is_active"):
                    return event
    except Exception as e:
        logger.error(f"Event Error: {e}")
    return None


def api_get_questions(event_id):
    try:
        response = requests.get(f"{API_URL}/events/{event_id}/questions/")
        if response.status_code == 200:
            return [
                {
                    "text": q["text"],
                    "options": q["options"],
                    "correct": q["correct_index"],
                }
                for q in response.json()
            ]
    except Exception as e:
        logger.error(f"Questions Error: {e}")
    return []


def api_send_score(tg_id, score, event_id=None):
    try:
        payload = {"tg_id": tg_id, "score": score, "event_id": event_id}
        requests.post(f"{API_URL}/submit-score/", json=payload)
    except Exception as e:
        logger.error(f"Score Error: {e}")


def api_get_leaderboard(event_id):
    try:
        response = requests.get(f"{API_URL}/events/{event_id}/leaderboard/")
        if response.status_code == 200:
            data = response.json()
            if not data:
                return "Пока пусто 😔"
            text = ""
            medals = ["🥇", "🥈", "🥉"]
            for i, r in enumerate(data):
                medal = medals[i] if i < 3 else f"{i+1}."
                text += f"{medal} {r['username']} — *{r['score']}*\n"
            return text
    except Exception as e:
        logger.error(f"Leaderboard Error: {e}")
        return "Ошибка загрузки."


def api_get_profile(tg_id):
    try:
        response = requests.get(f"{API_URL}/bot-profile/{tg_id}/")
        if response.status_code == 200:
            return response.json()
    except Exception as e:
        logger.error(f"Profile Error: {e}")
    return None


# ==================== AI & STATE ====================
def generate_quiz_gigachat():
    """Генерация вопросов через GigaChat"""
    if not GIGACHAT_CREDENTIALS:
        logger.warning("GigaChat token is missing!")
        return None

    prompt = """
    Ты генератор квизов. Создай 5 вопросов на тему IT (программирование, технологии).
    Верни ТОЛЬКО валидный JSON (без Markdown, без ```json).
    Формат:
    {
      "questions": [
        {
          "text": "Текст вопроса",
          "options": ["Вариант 1", "Вариант 2", "Вариант 3", "Вариант 4"],
          "correct": 0
        }
      ]
    }
    Индекс correct должен быть от 0 до 3.
    """

    try:
        with GigaChat(credentials=GIGACHAT_CREDENTIALS, verify_ssl_certs=False) as giga:
            response = giga.chat(prompt)
            raw_content = response.choices[0].message.content
            logger.info("GigaChat Raw Response received")

            # Очистка от Markdown (если модель вернет ```json ... ```)
            match = re.search(r"\{.*\}", raw_content, re.DOTALL)
            if match:
                json_str = match.group(0)
                data = json.loads(json_str)
                return data.get("questions", [])
            else:
                logger.error("JSON pattern not found in AI response")
                return None
    except Exception as e:
        logger.error(f"AI Generation Error: {e}")
        return None


user_data = {}
rooms = {}
quick_queue = []


# ==================== МЕНЮ И ОБРАБОТЧИКИ ====================
@bot.message_handler(commands=["start"])
def start(m):
    api_register_user(m.from_user)
    show_main_menu(
        m.chat.id, "Добро пожаловать в Skill Division! 🚀\nГлавное меню:")


def show_main_menu(chat_id, text):
    markup = types.ReplyKeyboardMarkup(resize_keyboard=True, row_width=2)
    markup.add("🎮 Играть", "👤 Мой профиль")
    markup.add("ℹ О мероприятии", "🏆 Топ игроков")
    markup.add("📂 О проекте")
    bot.send_message(chat_id, text, reply_markup=markup)


@bot.message_handler(func=lambda m: True)
def main_handler(m):
    chat_id = m.chat.id
    text = m.text

    # --- ГЛАВНОЕ МЕНЮ ИГРЫ ---
    if text == "🎮 Играть":
        markup = types.ReplyKeyboardMarkup(resize_keyboard=True)
        markup.add("👤 Одиночная", "⚔ Дуэль", "🔙 Назад")
        bot.send_message(chat_id, "Выберите режим игры:", reply_markup=markup)

    # --- ОДИНОЧНАЯ (ВЫБОР ИСТОЧНИКА) ---
    elif text == "👤 Одиночная":
        markup = types.ReplyKeyboardMarkup(resize_keyboard=True)
        markup.add("📅 Квиз события", "🤖 AI Квиз", "🔙 Назад")
        bot.send_message(chat_id, "Откуда брать вопросы?", reply_markup=markup)

    elif text == "📅 Квиз события":
        start_single_game(chat_id, use_ai=False)

    elif text == "🤖 AI Квиз":
        bot.send_message(chat_id, "Генерирую вопросы, подождите... 🧠")
        start_single_game(chat_id, use_ai=True)

    # --- ДУЭЛЬ ---
    elif text == "⚔ Дуэль":
        markup = types.ReplyKeyboardMarkup(resize_keyboard=True)
        markup.add("⚡ Быстрый поиск", "🔑 По коду",
                   "Создать комнату", "🔙 Назад")
        bot.send_message(chat_id, "Режим дуэли:", reply_markup=markup)

    # --- ИНФОРМАЦИЯ ---
    elif text == "📂 О проекте":
        info_text = (
            "🚀 *Skill Division*\n\n"
            "Интерактивная платформа для оценки навыков и проведения квизов на IT-мероприятиях.\n\n"
            "🛠 *Стек технологий:*\n"
            "— Backend: Django + DRF\n"
            "— Frontend: React\n"
            "— Bot: Python Telebot\n"
            "— AI: GigaChat API\n\n"
            "Создано для соревнований и обучения!"
        )
        bot.send_message(chat_id, info_text, parse_mode="Markdown")

    elif text == "ℹ О мероприятии":
        evt = api_get_active_event()
        if evt:
            evt_text = (
                f"📅 *Текущее событие:*\n{evt['title']}\n\n"
                f"📝 *Описание:*\n{evt.get('description', 'Без описания')}\n\n"
                f"🔑 *Код доступа:* `{evt['event_code']}`\n"
                f"📆 *Дата:* {evt['date']}"
            )
            bot.send_message(chat_id, evt_text, parse_mode="Markdown")
        else:
            bot.send_message(
                chat_id, "Сейчас нет активных мероприятий. Заходите позже!"
            )

    elif text == "👤 Мой профиль":
        profile = api_get_profile(chat_id)
        if profile:
            profile_text = (
                f"👤 *Карточка участника*\n\n"
                f"Никнейм: `{profile['username']}`\n"
                f"Роль: {profile['role']}\n"
                f"📅 Регистрация: {profile['date_joined']}\n\n"
                f"📊 *Статистика:*\n"
                f"Игр сыграно: {profile['games_played']}\n"
                f"Всего очков: *{profile['total_score']}* ⭐"
            )
            bot.send_message(chat_id, profile_text, parse_mode="Markdown")
        else:
            bot.send_message(
                chat_id, "Не удалось загрузить профиль. Попробуйте нажать /start"
            )

    elif text == "🏆 Топ игроков":
        evt = api_get_active_event()
        if evt:
            bot.send_message(
                chat_id,
                f"🏆 Лидеры *{evt['title']}*:\n\n"
                + str(api_get_leaderboard(evt["id"])),
                parse_mode="Markdown",
            )
        else:
            bot.send_message(chat_id, "Нет активных событий.")

    elif text == "🔙 Назад":
        show_main_menu(chat_id, "Главное меню")

    # --- ДУЭЛИ ЛОГИКА ---
    elif text == "Создать комнату":
        code = "".join(random.choices(string.digits, k=4))
        rooms[code] = {"players": [chat_id], "waiting": True}
        bot.send_message(
            chat_id,
            f"Комната создана!\nКод: `{code}`\nЖдем соперника...",
            parse_mode="Markdown",
        )

    elif text == "🔑 По коду":
        msg = bot.send_message(chat_id, "Введите 4-значный код:")
        bot.register_next_step_handler(msg, join_room)

    elif text == "⚡ Быстрый поиск":
        if chat_id in quick_queue:
            bot.send_message(chat_id, "Ты уже в очереди.")
        elif quick_queue:
            opponent = quick_queue.pop(0)
            start_duel(opponent, chat_id)
        else:
            quick_queue.append(chat_id)
            bot.send_message(chat_id, "Поиск соперника... ⏳")


# ==================== ФУНКЦИИ ИГРЫ ====================


def get_questions_logic(chat_id, use_ai=False):
    """
    Получает вопросы либо из БД (активный ивент), либо от AI.
    """
    evt_id = None
    questions = []

    # 1. Если выбран AI
    if use_ai:
        ai_questions = generate_quiz_gigachat()
        if ai_questions:
            return ai_questions, None  # None, так как ивент не привязан
        else:
            bot.send_message(
                chat_id, "⚠️ AI недоступен. Загружаю резервные вопросы.")
            # Fallback к обычным вопросам, если AI упал

    # 2. Обычный режим (или fallback)
    evt = api_get_active_event()
    if evt:
        questions = api_get_questions(evt["id"])
        evt_id = evt["id"]

    # 3. Полный Fallback (если и БД пустая)
    if not questions:
        questions = [
            {
                "text": "Какой язык мы изучаем?",
                "options": ["Python", "Java", "C++", "Assembly"],
                "correct": 0,
            },
            {
                "text": "Что такое Django?",
                "options": ["Фильм", "Фреймворк", "Еда", "Остров"],
                "correct": 1,
            },
        ]

    return questions, evt_id


def start_single_game(chat_id, use_ai=False):
    questions, evt_id = get_questions_logic(chat_id, use_ai)

    if not questions:
        bot.send_message(chat_id, "Не удалось получить вопросы.")
        return

    user_data[chat_id] = {
        "mode": "single",
        "questions": questions,
        "score": 0,
        "index": 0,
        "event_id": evt_id,
    }
    ask_question(chat_id)


def ask_question(chat_id):
    data = user_data.get(chat_id)
    if not data:
        return
    if data["index"] >= len(data["questions"]):
        end_single_game(chat_id)
        return
    q = data["questions"][data["index"]]
    markup = types.InlineKeyboardMarkup(row_width=2)
    markup.add(
        *[
            types.InlineKeyboardButton(opt, callback_data=f"ans_{i}")
            for i, opt in enumerate(q["options"])
        ]
    )
    bot.send_message(
        chat_id, f"Вопрос {data['index']+1}:\n{q['text']}", reply_markup=markup
    )


def end_single_game(chat_id):
    data = user_data[chat_id]

    # Отправляем очки на бэкенд (если это был AI квиз, event_id будет None,
    # бэкенд сохранит это как "без привязки к ивенту" или надо обработать это в Django,
    # но пока отправим как есть, главное сохранить score в профиль юзера)
    api_send_score(chat_id, data["score"], data["event_id"])

    bot.send_message(
        chat_id, f"🏁 Результат: {data['score']} очков! Данные сохранены.")
    del user_data[chat_id]
    show_main_menu(chat_id, "Игра окончена.")


# Дуэли (используют вопросы только из БД для честности)
def join_room(m):
    code = m.text.strip()
    if code in rooms and rooms[code]["waiting"]:
        p1 = rooms[code]["players"][0]
        del rooms[code]
        start_duel(p1, m.chat.id)
    else:
        bot.send_message(m.chat.id, "Ошибка кода.")


def start_duel(p1, p2):
    room_id = f"duel_{p1}_{p2}"
    # В дуэли всегда берем вопросы из БД (use_ai=False), чтобы было честно
    questions, evt_id = get_questions_logic(p1, use_ai=False)

    rooms[room_id] = {
        "players": [p1, p2],
        "scores": {p1: 0, p2: 0},
        "questions": questions,
        "event_id": evt_id,
        "current": 0,
        "answers": 0,
    }
    for p in [p1, p2]:
        user_data[p] = {"mode": "duel", "room_id": room_id}
        bot.send_message(p, "⚔ Бой!")
    ask_duel_question(room_id)


def ask_duel_question(room_id):
    room = rooms.get(room_id)
    if not room or room["current"] >= len(room["questions"]):
        end_duel(room_id)
        return
    q = room["questions"][room["current"]]
    markup = types.InlineKeyboardMarkup(row_width=2)
    markup.add(
        *[
            types.InlineKeyboardButton(opt, callback_data=f"duel_{i}")
            for i, opt in enumerate(q["options"])
        ]
    )
    room["answers"] = 0
    for p in room["players"]:
        bot.send_message(p, q["text"], reply_markup=markup)


def end_duel(room_id):
    room = rooms[room_id]
    p1, p2 = room["players"]
    s1, s2 = room["scores"][p1], room["scores"][p2]
    api_send_score(p1, s1, room["event_id"])
    api_send_score(p2, s2, room["event_id"])
    winner = "Ничья" if s1 == s2 else ("Игрок 1" if s1 > s2 else "Игрок 2")
    msg = f"🏁 Конец! {s1} : {s2}\nПобедил: {winner}"
    for p in room["players"]:
        bot.send_message(p, msg)
        del user_data[p]
        show_main_menu(p, "Главное меню")
    del rooms[room_id]


# Callbacks
@bot.callback_query_handler(func=lambda c: True)
def answer_handler(call):
    chat_id = call.message.chat.id
    udata = user_data.get(chat_id)
    if not udata:
        return
    try:
        bot.edit_message_reply_markup(
            chat_id, call.message.message_id, reply_markup=None
        )
    except Exception as e:
        logger.debug(f"Edit markup failed: {e}")

    if udata["mode"] == "single" and call.data.startswith("ans_"):
        choice = int(call.data.split("_")[1])
        q = udata["questions"][udata["index"]]
        if choice == q["correct"]:
            udata["score"] += 5
        udata["index"] += 1
        threading.Timer(0.5, ask_question, args=[chat_id]).start()

    elif udata["mode"] == "duel" and call.data.startswith("duel_"):
        room = rooms.get(udata["room_id"])
        if not room:
            return
        choice = int(call.data.split("_")[1])
        q = room["questions"][room["current"]]
        if choice == q["correct"]:
            room["scores"][chat_id] += 5
        room["answers"] += 1
        if room["answers"] >= 2:
            room["current"] += 1
            threading.Timer(0.5, ask_duel_question, args=[
                            udata["room_id"]]).start()


if __name__ == "__main__":
    logger.info("Bot Started!")
    bot.infinity_polling()
