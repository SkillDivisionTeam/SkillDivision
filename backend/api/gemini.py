import json
import os
import urllib.error
import urllib.request
from typing import Any

MOCK_TOPICS = [
    "Основы Python",
    "Архитектура Django",
    "React Хуки",
    "Контейнеры Docker",
    "Оптимизация SQL",
]

FALLBACK_TOPICS = ["Общие вопросы IT", "Алгоритмы", "Системный дизайн"]


def generate_quiz_topics(event_title: str) -> list[str]:
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not api_key:
        return MOCK_TOPICS

    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"gemini-2.5-flash:generateContent?key={api_key}"
    )
    payload: dict[str, Any] = {
        "contents": [
            {
                "parts": [
                    {
                        "text": (
                            f"Generate 5 technical quiz topics in Russian language "
                            f'suitable for an IT event titled "{event_title}". '
                            "The topics should be concise (2-4 words)."
                        )
                    }
                ]
            }
        ],
        "generationConfig": {
            "responseMimeType": "application/json",
            "responseSchema": {
                "type": "OBJECT",
                "properties": {
                    "topics": {
                        "type": "ARRAY",
                        "items": {"type": "STRING"},
                    }
                },
            },
        },
    }

    request = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            data = json.loads(response.read().decode("utf-8"))
        text = data["candidates"][0]["content"]["parts"][0]["text"]
        parsed = json.loads(text)
        topics = parsed.get("topics") or []
        return topics if isinstance(topics, list) and topics else FALLBACK_TOPICS
    except (
        urllib.error.URLError,
        KeyError,
        json.JSONDecodeError,
        IndexError,
        TypeError,
    ):
        return FALLBACK_TOPICS
