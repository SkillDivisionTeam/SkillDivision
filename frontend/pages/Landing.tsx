import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BarChart2, Shield, Users, Zap, Award, Target, Brain } from 'lucide-react';
import { Button } from '../components/UI';

const Landing: React.FC = () => {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 z-0">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl">
                <div className="absolute top-20 right-0 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl opacity-50"></div>
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-secondary-600/20 rounded-full blur-3xl opacity-50"></div>
            </div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700 mb-6">
            <span className="flex h-2 w-2 rounded-full bg-primary-500"></span>
            <span className="text-xs font-medium text-slate-300">Skill Division v1.0 Live</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6">
            Ваш путь к мастерству в <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-secondary-400">IT Сфере</span>
          </h1>
          <p className="mt-4 text-xl text-slate-400 max-w-3xl mx-auto mb-10">
            Платформа для проведения интерактивных IT-квизов и аналитики навыков. 
            От Telegram-бота для участников до мощной аналитической панели для Организаторов и HR.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/register">
              <Button size="lg" className="w-full sm:w-auto h-12 px-8 text-lg">
                Начать сейчас <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/about">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto h-12 px-8 text-lg">
                Узнать больше
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Vision & Problem Section */}
      <section className="py-16 bg-slate-800/30 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-8">Зачем нужен Skill Division?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                <div className="p-6 bg-slate-900 rounded-xl border border-slate-800">
                    <h3 className="text-xl font-semibold text-primary-400 mb-3">Проблема Meet-up'ов</h3>
                    <p className="text-slate-400">
                        Отсутствие прямых каналов связи после мероприятия. Скучные бумажные анкеты для тестирования навыков и низкая вовлеченность аудитории.
                    </p>
                </div>
                <div className="p-6 bg-slate-900 rounded-xl border border-slate-800">
                    <h3 className="text-xl font-semibold text-secondary-400 mb-3">Сложности HR</h3>
                    <p className="text-slate-400">
                        Невозможность провести беседу со всеми потенциальными кандидатами и отсутствие объективной метрики оценки навыков участников в моменте.
                    </p>
                </div>
                <div className="p-6 bg-slate-900 rounded-xl border border-slate-800">
                    <h3 className="text-xl font-semibold text-emerald-400 mb-3">Наше решение</h3>
                    <p className="text-slate-400">
                        Интерактивная платформа: Telegram-бот для быстрого входа в игру и Веб-интерфейс для глубокой аналитики и управления контентом.
                    </p>
                </div>
            </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="py-20 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-white">Преимущества платформы</h2>
                <p className="mt-4 text-slate-400">Ценность для всех участников экосистемы мероприятия.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Community */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Users className="text-blue-400" />
                        <h3 className="text-lg font-bold text-white">IT Сообщество</h3>
                    </div>
                    <BenefitCard text="Интерактив на мероприятии доступный каждому" />
                    <BenefitCard text="Легко заявить о себе окружающим и работодателям" />
                    <BenefitCard text="Доступность информации о мероприятии и участниках" />
                </div>

                {/* HR */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Target className="text-purple-400" />
                        <h3 className="text-lg font-bold text-white">HR-специалисты</h3>
                    </div>
                    <BenefitCard text="Отчет по компетенциям участников (Skill Matrix)" />
                    <BenefitCard text="Сегментация по уровню знаний (Junior/Middle/Senior)" />
                    <BenefitCard text="Простой способ связаться с нужным кандидатом" />
                </div>

                {/* Organizers */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Award className="text-yellow-400" />
                        <h3 className="text-lg font-bold text-white">Организаторы</h3>
                    </div>
                    <BenefitCard text="Повышение узнаваемости бренда через геймификацию" />
                    <BenefitCard text="Детальный отчет об активности участников" />
                    <BenefitCard text="Кастомизация квизов под тематику мероприятия с AI" />
                </div>
            </div>
        </div>
      </section>

      {/* Concept & Features */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
             <div className="bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700 rounded-2xl p-8 lg:p-12 overflow-hidden relative">
                <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
                    <div>
                        <h2 className="text-3xl font-bold text-white mb-6">Концепция решения</h2>
                        <p className="text-slate-300 mb-6 leading-relaxed">
                            Система «Skill Division» представляет собой гибридную платформу:
                        </p>
                        <ul className="space-y-4 text-slate-400">
                            <li className="flex items-start gap-3">
                                <Zap className="w-6 h-6 text-primary-400 flex-shrink-0" />
                                <div>
                                    <strong className="text-white">Telegram-бот (Тонкий клиент):</strong>
                                    <p className="text-sm mt-1">Регистрация, участие в дуэлях, таблица лидеров. Максимальная доступность без установки приложений.</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <BarChart2 className="w-6 h-6 text-secondary-400 flex-shrink-0" />
                                <div>
                                    <strong className="text-white">Веб-приложение (Admin/HR):</strong>
                                    <p className="text-sm mt-1">Создание ивентов, генерация вопросов через AI, экспорт CSV и аналитика талантов.</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <Brain className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                                <div>
                                    <strong className="text-white">AI Генерация:</strong>
                                    <p className="text-sm mt-1">Автоматическое создание уникальных вопросов для квизов на основе темы мероприятия.</p>
                                </div>
                            </li>
                        </ul>
                    </div>
                    <div className="bg-slate-950/50 p-6 rounded-xl border border-slate-700">
                        <div className="flex flex-col gap-4">
                            <div className="h-2 bg-slate-800 rounded w-1/3"></div>
                            <div className="h-32 bg-slate-800/50 rounded flex items-center justify-center border border-dashed border-slate-700">
                                <span className="text-slate-600">График активности (Demo)</span>
                            </div>
                            <div className="space-y-2">
                                <div className="h-2 bg-slate-800 rounded w-full"></div>
                                <div className="h-2 bg-slate-800 rounded w-5/6"></div>
                                <div className="h-2 bg-slate-800 rounded w-4/6"></div>
                            </div>
                        </div>
                    </div>
                </div>
             </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-6">Готовы повысить уровень вашего мероприятия?</h2>
            <p className="text-slate-300 mb-8 max-w-2xl mx-auto">
                Присоединяйтесь к тысячам разработчиков и организаторов, использующих Skill Division для геймификации обучения и нетворкинга.
            </p>
            <div className="flex justify-center gap-4">
                <Link to="/register">
                    <Button className="h-12 px-8">Создать аккаунт</Button>
                </Link>
                <Link to="/about">
                     <Button variant="ghost" className="h-12 px-8">Подробнее о стеке</Button>
                </Link>
            </div>
        </div>
      </section>
    </div>
  );
};

const BenefitCard: React.FC<{ text: string }> = ({ text }) => (
    <div className="p-4 rounded-lg bg-slate-800 border border-slate-700 flex items-start gap-3 hover:border-slate-600 transition-colors">
        <Shield className="w-5 h-5 text-slate-500 mt-0.5 flex-shrink-0" />
        <span className="text-slate-300 text-sm">{text}</span>
    </div>
);

export default Landing;