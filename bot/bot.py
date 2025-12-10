import telebot
from telebot import types
import threading
import sqlite3
import random
import string
from datetime import datetime
from telebot.apihelper import ApiTelegramException
import json
from gigachat import GigaChat
from dotenv import load_dotenv
import os
import logging
import re

load_dotenv()

# Настройка логирования
logging.basicConfig(level=logging.INFO, format='[%(asctime)s] %(levelname)s: %(message)s', datefmt='%H:%M:%S')
logger = logging.getLogger(__name__)

# Подавление ошибок от telebot при остановке
telebot.logger.setLevel(logging.CRITICAL)

# ==================== ТОКЕНЫ ====================
TOKEN = os.getenv('TG_TOKEN')
GIGACHAT_CREDENTIALS = os.getenv('GIGACHAT_TOKEN')

if not TOKEN:
    raise ValueError("TG_TOKEN не найден в переменных окружения!")
if not GIGACHAT_CREDENTIALS:
    logger.warning("Внимание: GIGACHAT_TOKEN не найден. Будет использоваться fallback-квиз")

bot = telebot.TeleBot(TOKEN)

# ==================== БЕЗОПАСНЫЕ ФУНКЦИИ ====================
def safe_send(chat_id, text, parse_mode=None, reply_markup=None, **kwargs):
    try:
        return bot.send_message(chat_id, text, parse_mode=parse_mode, reply_markup=reply_markup, **kwargs)
    except ApiTelegramException as e:
        if e.error_code == 403:
            logger.info(f"User {chat_id} blocked the bot")
        else:
            logger.error(f"Telegram error {e.error_code}: {e.description}")
    except Exception as e:
        logger.error(f"Send error to {chat_id}: {e}")

def safe_delete(chat_id, message_id):
    try:
        bot.delete_message(chat_id, message_id)
    except ApiTelegramException as e:
        logger.error(f"Delete message error: {e.description}")
    except Exception as e:
        logger.error(f"Unexpected delete error: {e}")

# ==================== БАЗА ЛИДЕРОВ ====================
conn = sqlite3.connect('leaders.db', check_same_thread=False)
c = conn.cursor()
c.execute('''CREATE TABLE IF NOT EXISTS leaders
             (user_id INTEGER, username TEXT, theme TEXT, score INTEGER, max_score INTEGER, date TEXT)''')
conn.commit()

def save_score(user_id, username, theme, score, max_score):
    c.execute("SELECT score FROM leaders WHERE user_id=? AND theme=?", (user_id, theme))
    row = c.fetchone()
    if not row or score > row[0]:
        c.execute("REPLACE INTO leaders VALUES (?, ?, ?, ?, ?, ?)",
                  (user_id, username or "Unknown", theme, score, max_score, datetime.now().strftime("%Y-%m-%d %H:%M")))
        conn.commit()

def get_top(theme="IT-основы", limit=10):
    c.execute("SELECT username, score, max_score, date FROM leaders WHERE theme=? ORDER BY score DESC LIMIT ?", (theme, limit))
    rows = c.fetchall()
    if not rows:
        return "Пока никто не играл 😔"
    text = "🏆 Топ игроков (IT-основы):\n\n"
    for i, row in enumerate(rows, 1):
        text += f"{i}. {row[0]} — {row[1]}/{row[2]} очков ({row[3]})\n"
    return text

# ==================== ГЕНЕРАЦИЯ КВИЗА GIGACHAT ====================
def generate_quiz_gigachat():
    prompt = """
Ты — идеальный генератор квизов. Сгенерируй ровно 5 новых, интересных вопросов по теме "IT-основы" (уровень начинающий/средний).
Каждый вопрос: 4 варианта ответа, только один правильный. Индекс правильного ответа (correct) должен быть целым числом от 0 до 3 включительно.

ВЕРНИ СТРОГО ТОЛЬКО JSON БЕЗ ЛИШНЕГО ТЕКСТА И БЕЗ ```json:

{
  "info": "🖥 *Квиз по IT-основам*\\n\\n5 вопросов • 10 секунд на ответ\\n+5 за правильный • 0 за неправильный • –3 за таймаут\\n\\nУдачи! 🚀",
  "questions": [
    {
      "text": "Текст вопроса?",
      "options": ["вариант 1", "вариант 2", "вариант 3", "вариант 4"],
      "correct": 0
    }
    // ещё 4 вопроса
  ]
}
"""

    try:
        with GigaChat(credentials=GIGACHAT_CREDENTIALS, verify_ssl_certs=False, scope="GIGACHAT_API_PERS") as giga:
            response = giga.chat(prompt)
        raw = response.choices[0].message.content.strip()

        # Улучшенная обработка с использованием регулярных выражений для извлечения JSON
        match = re.search(r'\{.*\}', raw, re.DOTALL)
        if match:
            json_str = match.group(0)
            data = json.loads(json_str)
            questions = data.get("questions", [])
            if len(questions) == 5:
                # Валидация и приведение correct к int
                for q in questions:
                    if "correct" in q:
                        q["correct"] = int(q["correct"])
                    if not isinstance(q.get("correct"), int) or not 0 <= q["correct"] < 4:
                        raise ValueError(f"Invalid correct index: {q.get('correct')}")
                logger.info("Новый квиз успешно получен от GigaChat")
                return data
        else:
            raise ValueError("Не удалось извлечь JSON из ответа")
    except json.JSONDecodeError as e:
        logger.error(f"JSON parse error: {e}")
    except ValueError as e:
        logger.error(f"Quiz validation error: {e}")
    except Exception as e:
        logger.error(f"GigaChat error: {e}")
    return None

# ==================== ЗАГРУЗКА КВИЗА (ИИ + fallback) ====================
def load_quiz(chat_id):
    safe_send(chat_id, "Генерирую квиз. Это может занять некоторое время.")
    quiz = generate_quiz_gigachat()
    if quiz:
        return quiz

    logger.warning("GigaChat недоступен — загружаем старый квиз")
    return {
        "info": "🖥 *Квиз по IT-основам*\n\n5 вопросов • 10 секунд на ответ\n+5 за правильный • 0 за неправильный • –3 за таймаут\n\nУдачи! 🚀",
        "questions": [
            {"text": "Что расшифровывается как CPU?", "options": ["Central Processing Unit", "Computer Personal Unit", "Central Power Unit", "Control Processing Unit"], "correct": 0},
            {"text": "Кто изобрёл World Wide Web?", "options": ["Билл Гейтс", "Тим Бернерс-Ли", "Стив Джобс", "Марк Цукерберг"], "correct": 1},
            {"text": "Какой протокол используется для веб-страниц?", "options": ["FTP", "SMTP", "HTTP", "SSH"], "correct": 2},
            {"text": "Кто создал Python?", "options": ["Java", "JavaScript", "Гвидо ван Россум", "Ruby"], "correct": 2},
            {"text": "SSD — это?", "options": ["Super Speed Drive", "Solid State Drive", "Secure System Disk", "Simple Storage Device"], "correct": 1},
        ]
    }

# ==================== ХРАНИЛИЩА ====================
user_data = {}
rooms = {}
quick_queue = []

# ==================== МЕНЮ ====================
def events_menu(chat_id):
    markup = types.ReplyKeyboardMarkup(resize_keyboard=True, row_width=1)
    markup.add("Мероприятие 1", "Мероприятие 2", "Мероприятие 3")
    markup.add("Информация о Skill Division")
    safe_send(chat_id, "Выберите мероприятие:", reply_markup=markup)

def main_menu(chat_id):
    markup = types.ReplyKeyboardMarkup(resize_keyboard=True, row_width=2)
    markup.add("🎮 Одиночная", "⚔ Дуэль")
    markup.add("🏆 Топ игроков", "Информация о мероприятии")
    markup.add("← К выбору мероприятия")
    safe_send(chat_id, "🏠 Главное меню", reply_markup=markup)

@bot.message_handler(commands=['start'])
def start(m):
    chat_id = m.chat.id
    safe_send(chat_id, "Привет! 👋\nЭто квиз-бот с вопросами от GigaChat\nОдиночная игра и дуэль 1×1\n10 секунд на вопрос ⏱")
    markup = types.ReplyKeyboardMarkup(resize_keyboard=True, row_width=1)
    markup.add("Старт")
    safe_send(chat_id, "Нажмите кнопку для начала:", reply_markup=markup)

# ==================== ОБРАБОТКА КНОПОК ====================
@bot.message_handler(func=lambda m: True)
def handler(m):
    chat_id = m.chat.id
    text = m.text

    if text == "Старт":
        events_menu(chat_id)
    elif text == "Информация о Skill Division":
        safe_send(chat_id, "Hello world!")
        events_menu(chat_id)
    elif text == "Мероприятие 1":
        main_menu(chat_id)
    elif text in ["Мероприятие 2", "Мероприятие 3"]:
        safe_send(chat_id, "Это мероприятие в разработке.")
        events_menu(chat_id)
    elif text == "Информация о мероприятии":
        safe_send(chat_id, "Hello world!")
        main_menu(chat_id)
    elif text == "🎮 Одиночная":
        quiz = load_quiz(chat_id)
        user_data[chat_id] = {"mode": "single", "quiz": quiz, "score": 0, "question_index": 0, "answered": False, "timer": None}
        safe_send(chat_id, quiz["info"], parse_mode="Markdown")
        markup = types.InlineKeyboardMarkup()
        markup.add(types.InlineKeyboardButton("🚀 Начать", callback_data="start_single"))
        safe_send(chat_id, "Готов? Жми кнопку", reply_markup=markup)

    elif text == "⚔ Дуэль":
        markup = types.ReplyKeyboardMarkup(resize_keyboard=True)
        markup.add("🔒 По коду", "⚡ Быстрая дуэль", "← Назад")
        safe_send(chat_id, "Режим дуэли:", reply_markup=markup)

    elif text == "🔒 По коду":
        markup = types.ReplyKeyboardMarkup(resize_keyboard=True)
        markup.add("Создать комнату", "Присоединиться", "← Назад")
        safe_send(chat_id, "Дуэль по коду:", reply_markup=markup)

    elif text == "Создать комнату":
        code = ''.join(random.choices(string.digits, k=4))
        while code in rooms:
            code = ''.join(random.choices(string.digits, k=4))
        rooms[code] = {"players": [chat_id], "waiting": True}
        markup = types.ReplyKeyboardMarkup(resize_keyboard=True)
        markup.add("Отмена")
        safe_send(chat_id, f"Комната создана!\nКод: *{code}*\nЖдём второго игрока…", parse_mode="Markdown", reply_markup=markup)

    elif text == "Присоединиться":
        msg = safe_send(chat_id, "Введи 4-значный код:")
        bot.register_next_step_handler(msg, join_by_code)

    elif text == "⚡ Быстрая дуэль":
        quick_match(chat_id)

    elif text == "🏆 Топ игроков":
        safe_send(chat_id, get_top())

    elif text == "← К выбору мероприятия":
        if chat_id in quick_queue:
            quick_queue.remove(chat_id)
        user_data.pop(chat_id, None)
        events_menu(chat_id)

    elif text in ["Отмена", "← Назад"]:
        if chat_id in quick_queue:
            quick_queue.remove(chat_id)
        user_data.pop(chat_id, None)
        main_menu(chat_id)

# ==================== БЫСТРАЯ ДУЭЛЬ И ПО КОДУ ====================
def quick_match(chat_id):
    if chat_id in quick_queue:
        safe_send(chat_id, "Ты уже в очереди!")
        return
    if quick_queue:
        opponent = quick_queue.pop(0)
        code = ''.join(random.choices(string.ascii_letters + string.digits, k=10))
        quiz = load_quiz(chat_id)
        rooms[code] = {"players": [opponent, chat_id], "quiz": quiz, "current": 0, "scores": {opponent: 0, chat_id: 0}, "answered": set(), "timer": None}
        for pid in [opponent, chat_id]:
            user_data.pop(pid, None)
            safe_send(pid, quiz["info"], parse_mode="Markdown")
            markup = types.InlineKeyboardMarkup()
            markup.add(types.InlineKeyboardButton("🚀 Готов! Начать", callback_data=f"start_duel_{code}"))
            safe_send(pid, "Соперник найден! Жми когда готов", reply_markup=markup)
    else:
        quick_queue.append(chat_id)
        markup = types.ReplyKeyboardMarkup(resize_keyboard=True)
        markup.add("Отмена")
        safe_send(chat_id, "Ищем соперника… ⏳", reply_markup=markup)

def join_by_code(m):
    code = m.text.strip()
    if code not in rooms or len(rooms[code]["players"]) == 2:
        safe_send(m.chat.id, "Код неверный или комната полная")
        main_menu(m.chat.id)
        return
    rooms[code]["players"].append(m.chat.id)
    quiz = load_quiz(m.chat.id)
    rooms[code]["quiz"] = quiz
    rooms[code]["waiting"] = False
    rooms[code]["current"] = 0
    rooms[code]["scores"] = {p: 0 for p in rooms[code]["players"]}
    rooms[code]["answered"] = set()

    for pid in rooms[code]["players"]:
        safe_send(pid, quiz["info"], parse_mode="Markdown")
        markup = types.InlineKeyboardMarkup()
        markup.add(types.InlineKeyboardButton("🚀 Готов! Начать", callback_data=f"start_duel_{code}"))
        safe_send(pid, "Соперник подключился! Жми когда готов", reply_markup=markup)

# ==================== ОДИНОЧКА ====================
@bot.callback_query_handler(func=lambda c: c.data == "start_single")
def start_single(call):
    safe_delete(call.message.chat.id, call.message.message_id)
    ask_question_single(call.message.chat.id)

def ask_question_single(chat_id):
    user = user_data.get(chat_id)
    if not user or user["question_index"] >= 5:
        end_single(chat_id)
        return
    q = user["quiz"]["questions"][user["question_index"]]
    markup = types.InlineKeyboardMarkup(row_width=2)
    for i, opt in enumerate(q["options"]):
        markup.add(types.InlineKeyboardButton(opt, callback_data=f"single_ans_{i}"))
    safe_send(chat_id, f"Вопрос {user['question_index']+1}/5\n\n{q['text']}", reply_markup=markup)

    user["answered"] = False
    timer = threading.Timer(10.0, lambda: single_timeout(chat_id))
    timer.start()
    user["timer"] = timer

def single_timeout(chat_id):
    user = user_data.get(chat_id)
    if user and not user["answered"]:
        user["answered"] = True
        user["score"] -= 3
        safe_send(chat_id, "Время вышло! –3 очка")
        next_single(chat_id)

@bot.callback_query_handler(func=lambda c: c.data.startswith("single_ans_"))
def single_answer(call):
    user = user_data.get(call.message.chat.id)
    if not user or user["answered"]:
        return
    user["answered"] = True
    if user["timer"]:
        user["timer"].cancel()
    q = user["quiz"]["questions"][user["question_index"]]
    choice = int(call.data.split("_")[2])
    correct = q["correct"]
    if choice == correct:
        user["score"] += 5
        bot.answer_callback_query(call.id, "Верно! +5 ✅")
    else:
        correct_opt = q["options"][correct]
        bot.answer_callback_query(call.id, f"Неправильно. Правильный ответ: {correct_opt} ❌")
    next_single(call.message.chat.id)

def next_single(chat_id):
    user_data[chat_id]["question_index"] += 1
    threading.Timer(1.5, lambda: ask_question_single(chat_id)).start()

def end_single(chat_id):
    user = user_data[chat_id]
    save_score(chat_id, bot.get_chat(chat_id).first_name or "Unknown", "IT-основы", user["score"], 25)
    text = f"Квиз завершён!\nВаш результат: *{user['score']}*/25 очков 👏"
    markup = types.InlineKeyboardMarkup()
    markup.add(types.InlineKeyboardButton("Главное меню", callback_data="to_main"))
    safe_send(chat_id, text, parse_mode="Markdown", reply_markup=markup)
    del user_data[chat_id]

# ==================== ДУЭЛЬ ====================
@bot.callback_query_handler(func=lambda c: c.data.startswith("start_duel_"))
def start_duel(call):
    code = call.data.split("_")[2]
    if code not in rooms:
        return
    room = rooms[code]
    room["answered"].add(call.message.chat.id)
    safe_delete(call.message.chat.id, call.message.message_id)

    if len(room["answered"]) == 2:
        room["answered"] = set()
        ask_question_duel(code)

def ask_question_duel(code):
    room = rooms[code]
    idx = room["current"]
    q = room["quiz"]["questions"][idx]
    markup = types.InlineKeyboardMarkup(row_width=2)
    for i, opt in enumerate(q["options"]):
        markup.add(types.InlineKeyboardButton(opt, callback_data=f"ans_{code}_{i}"))

    scores_text = "\n\nОчки: " + " | ".join(f"{bot.get_chat(p).first_name}: {room['scores'][p]}" for p in room["players"])
    text = f"Вопрос {idx+1}/5\n\n{q['text']}{scores_text}"

    for pid in room["players"]:
        safe_send(pid, text, reply_markup=markup)

    room["timer"] = threading.Timer(10.0, lambda: duel_timeout(code))
    room["timer"].start()

def duel_timeout(code):
    if code not in rooms:
        return
    room = rooms[code]
    for pid in room["players"]:
        if pid not in room["answered"]:
            room["scores"][pid] -= 3
            safe_send(pid, "Время вышло! –3 очка")
    next_duel_question(code)

@bot.callback_query_handler(func=lambda c: c.data.startswith("ans_"))
def duel_answer(call):
    parts = call.data.split("_")
    code = parts[1]
    choice = int(parts[2])
    chat_id = call.message.chat.id
    if code not in rooms:
        return
    room = rooms[code]
    if chat_id in room["answered"]:
        return
    room["answered"].add(chat_id)

    q = room["quiz"]["questions"][room["current"]]
    correct = q["correct"]
    if choice == correct:
        room["scores"][chat_id] += 5
        bot.answer_callback_query(call.id, "Верно! +5 ✅")
    else:
        correct_opt = q["options"][correct]
        bot.answer_callback_query(call.id, f"Неправильно. Правильный ответ: {correct_opt} ❌")

    if len(room["answered"]) == 2:
        room["timer"].cancel()
        next_duel_question(code)

def next_duel_question(code):
    room = rooms[code]
    room["current"] += 1
    room["answered"] = set()
    if room["current"] >= 5:
        end_duel(code)
    else:
        threading.Timer(2.0, lambda: ask_question_duel(code)).start()

def end_duel(code):
    room = rooms[code]
    p1, p2 = room["players"]
    s1, s2 = room["scores"][p1], room["scores"][p2]
    name1 = bot.get_chat(p1).first_name
    name2 = bot.get_chat(p2).first_name

    save_score(p1, name1, "IT-основы", s1, 25)
    save_score(p2, name2, "IT-основы", s2, 25)

    winner = "Ничья!" if s1 == s2 else f"Победил {name1 if s1 > s2 else name2}! 🎉"
    result = f"Дуэль окончена!\n{winner}\n\n{name1}: {s1}/25\n{name2}: {s2}/25"

    markup = types.InlineKeyboardMarkup()
    markup.add(types.InlineKeyboardButton("Главное меню", callback_data="to_main"))
    for pid in room["players"]:
        safe_send(pid, result, reply_markup=markup)
    del rooms[code]

# ==================== ВОЗВРАТ В МЕНЮ ====================
@bot.callback_query_handler(func=lambda c: c.data == "to_main")
def to_main(call):
    chat_id = call.message.chat.id
    safe_delete(chat_id, call.message.message_id)
    bot.answer_callback_query(call.id)
    user_data.pop(chat_id, None)
    if chat_id in quick_queue:
        quick_queue.remove(chat_id)
    main_menu(chat_id)

# ==================== ЗАПУСК ====================
if __name__ == '__main__':
    logger.info("Бот запущен! Вопросы генерирует GigaChat")
    bot.infinity_polling()