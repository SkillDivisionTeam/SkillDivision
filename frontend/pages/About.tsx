import React from 'react';
import { Card } from '../components/UI';
import { Database, Server, Smartphone, Globe, Layers, ShieldCheck, Zap } from 'lucide-react';

const About: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-white mb-4">О проекте Skill Division</h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto">
          Комплексная платформа, объединяющая backend логику, Telegram-ботов и frontend визуализацию для проведения интерактивных IT-мероприятий.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">Архитектура</h2>
          <p className="text-slate-400 leading-relaxed mb-6">
            Skill Division построен на надежной архитектуре с использованием Docker контейнеров.
            Мы строго разделяем зоны ответственности: мощный Backend на Python/Django управляет базой данных PostgreSQL и логикой игры,
            в то время как Frontend (React + Vite) и Telegram-бот действуют как специализированные клиенты, общающиеся через REST API.
          </p>
          <ul className="space-y-4">
            <ArchitectureItem 
              icon={<Database className="text-blue-400" />} 
              title="PostgreSQL & Django" 
              desc="Централизованное хранение данных и движок бизнес-логики." 
            />
            <ArchitectureItem 
              icon={<Smartphone className="text-green-400" />} 
              title="Telegram-бот" 
              desc="«Тонкий клиент» для участников, чтобы проходить квизы на ходу." 
            />
            <ArchitectureItem 
              icon={<Globe className="text-purple-400" />} 
              title="React+Vite Frontend" 
              desc="Веб-интерфейс для организаторов, HR и аналитики." 
            />
          </ul>
        </div>
        <div className="relative">
             {/* Abstract Representation of Architecture */}
             <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-secondary-500/10 rounded-2xl blur-3xl"></div>
             <Card className="h-full relative z-10 border-slate-700 bg-slate-900/80">
                <div className="flex flex-col h-full justify-center space-y-8 p-4">
                    <div className="border border-slate-600 rounded p-4 text-center bg-slate-800">
                        <span className="font-mono text-blue-300">Nginx Reverse Proxy (Docker)</span>
                    </div>
                    <div className="flex justify-between gap-4">
                        <div className="flex-1 border border-slate-600 rounded p-4 text-center bg-slate-800">
                             <span className="font-mono text-purple-300">Frontend :3000</span>
                        </div>
                        <div className="flex-1 border border-slate-600 rounded p-4 text-center bg-slate-800">
                             <span className="font-mono text-green-300">Backend :8000</span>
                        </div>
                    </div>
                    <div className="border border-slate-600 rounded p-4 text-center bg-slate-800">
                         <span className="font-mono text-yellow-300">PostgreSQL DB</span>
                    </div>
                </div>
             </Card>
        </div>
      </div>

      <div className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Цели и Задачи</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-slate-800/50">
                  <Zap className="w-8 h-8 text-yellow-400 mb-4" />
                  <h3 className="text-lg font-bold text-white mb-2">Вовлеченность</h3>
                  <p className="text-slate-400 text-sm">Повышение активности участников IT-митапов через геймификацию и соревнования.</p>
              </Card>
              <Card className="bg-slate-800/50">
                  <Layers className="w-8 h-8 text-blue-400 mb-4" />
                  <h3 className="text-lg font-bold text-white mb-2">Сбор данных</h3>
                  <p className="text-slate-400 text-sm">Автоматический сбор статистики по знаниям и навыкам для HR и организаторов.</p>
              </Card>
              <Card className="bg-slate-800/50">
                  <ShieldCheck className="w-8 h-8 text-emerald-400 mb-4" />
                  <h3 className="text-lg font-bold text-white mb-2">Безопасность</h3>
                  <p className="text-slate-400 text-sm">Защищенное хранение данных и соответствие нормам обработки персональной информации.</p>
              </Card>
          </div>
      </div>

      <div className="border-t border-slate-800 pt-16 text-center">
         <h3 className="text-2xl font-bold text-white mb-6">Свяжитесь с нами</h3>
         <p className="text-slate-400">
            Создано для образовательных и соревновательных мероприятий по программированию. <br/>
            Свяжитесь с командой разработки: <a href="mailto:dev@skilldivision.com" className="text-primary-400 hover:underline">dev@skilldivision.com</a>
         </p>
      </div>
    </div>
  );
};

const ArchitectureItem: React.FC<{ icon: React.ReactNode; title: string; desc: string }> = ({ icon, title, desc }) => (
    <div className="flex items-start">
        <div className="mt-1 p-2 bg-slate-800 rounded-lg mr-4 border border-slate-700">
            {icon}
        </div>
        <div>
            <h4 className="text-white font-medium">{title}</h4>
            <p className="text-sm text-slate-500">{desc}</p>
        </div>
    </div>
)

export default About;