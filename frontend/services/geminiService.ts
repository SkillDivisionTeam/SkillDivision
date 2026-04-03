import { GoogleGenAI, Type } from "@google/genai";

// Ideally, this is handled on the backend (Django), but for this frontend demo
// we provide a helper to brainstorm quiz topics client-side.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateQuizTopics = async (eventTitle: string): Promise<string[]> => {
  if (!process.env.API_KEY) {
    console.warn("API Key is missing. Returning mock data.");
    return ["Основы Python", "Архитектура Django", "React Хуки", "Контейнеры Docker", "Оптимизация SQL"];
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate 5 technical quiz topics in Russian language suitable for an IT event titled "${eventTitle}". The topics should be concise (2-4 words).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topics: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of 5 technical topics in Russian"
            }
          }
        }
      }
    });

    const data = JSON.parse(response.text || '{}');
    return data.topics || [];
  } catch (error) {
    console.error("Gemini API Error:", error);
    return ["Общие вопросы IT", "Алгоритмы", "Системный дизайн"];
  }
};
