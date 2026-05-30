import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Type } from 'lucide-react';
import { Button, Input, Card } from '../components/UI';
import { createEvent, generateQuizTopics } from '../services/api';

const CreateEvent: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    event_code: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [suggestedTopics, setSuggestedTopics] = useState<string[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAiSuggest = async () => {
    if (!formData.title) return;
    setAiLoading(true);
    try {
      const topics = await generateQuizTopics(formData.title);
      setSuggestedTopics(topics);
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createEvent({
        ...formData,
        is_active: true
      });
      navigate('/events');
    } catch {
      console.error("Failed to create event");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Создать новое мероприятие</h1>
        <p className="text-slate-400 mt-1">Настройте новую сессию квиза для ваших участников.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="Название мероприятия"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Например: Python Summer Camp 2024"
                required
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Дата проведения"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                />
                <Input
                  label="Код доступа"
                  name="event_code"
                  value={formData.event_code}
                  onChange={handleChange}
                  placeholder="Например: PY2024"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Описание</label>
                <textarea
                  name="description"
                  rows={4}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-white placeholder-slate-500 outline-none transition-all"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Краткое описание мероприятия и тематики..."
                />
              </div>

              <div className="flex justify-end gap-4">
                <Button type="button" variant="ghost" onClick={() => navigate('/events')}>Отмена</Button>
                <Button type="submit" isLoading={loading}>Создать</Button>
              </div>
            </form>
          </Card>
        </div>

        {/* AI Assistant Sidebar */}
        <div>
          <Card className="bg-gradient-to-b from-slate-900 to-indigo-950/30 border-indigo-500/20">
            <div className="flex items-center gap-2 mb-4 text-indigo-400">
              <Sparkles className="w-5 h-5" />
              <h3 className="font-semibold">AI Ассистент</h3>
            </div>
            <p className="text-sm text-slate-400 mb-6">
              Нужны идеи для квиза? Введите название мероприятия, и наш AI предложит актуальные технические темы.
            </p>

            <Button
              type="button"
              variant="secondary"
              className="w-full mb-6 border-indigo-500/30 text-indigo-300 hover:bg-indigo-950/50 hover:text-white"
              onClick={handleAiSuggest}
              isLoading={aiLoading}
              disabled={!formData.title}
            >
              Генерировать темы
            </Button>

            {suggestedTopics.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-uppercase font-bold text-slate-500 tracking-wider">ПРЕДЛОЖЕНИЯ</h4>
                <ul className="space-y-2">
                  {suggestedTopics.map((topic, index) => (
                    <li key={index} className="bg-slate-800/50 px-3 py-2 rounded text-sm text-slate-300 border border-slate-700/50">
                      {topic}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-slate-600 mt-4 italic">
                  * Сгенерировано Gemini 2.5 Flash
                </p>
              </div>
            )}

            {suggestedTopics.length === 0 && !aiLoading && (
                <div className="border border-dashed border-slate-700 rounded-lg p-8 text-center">
                    <Type className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-slate-600 text-xs">Темы появятся здесь</p>
                </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreateEvent;
