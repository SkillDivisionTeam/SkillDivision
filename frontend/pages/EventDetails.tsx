import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Hash,
  Download,
  Activity,
  Trophy,
  PieChart as PieChartIcon,
  Loader2
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  Legend
} from 'recharts';
import { Button, Card, Badge } from '../components/UI';
import { getEventById, getEventStats } from '../services/api';
import { Event, EventStats } from '../types';

const EventDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [stats, setStats] = useState<EventStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const eventData = await getEventById(Number(id));
        const statsData = await getEventStats(Number(id));

        if (eventData) {
          setEvent(eventData);
          setStats(statsData);
        }
      } catch (error) {
        console.error("Failed to load event details", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-900">
        <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
      </div>
    );
  }

  if (!event || !stats) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10 text-center text-slate-400">
        Мероприятие не найдено.
      </div>
    );
  }

  const COLORS = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link to="/events" className="inline-flex items-center text-slate-400 hover:text-white mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" /> Назад к списку
        </Link>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-white">{event.title}</h1>
              <Badge color={event.is_active ? 'green' : 'blue'}>
                {event.is_active ? 'LIVE' : 'Запланировано'}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-slate-400 text-sm">
              <span className="flex items-center"><Calendar className="w-4 h-4 mr-1" /> {event.date}</span>
              <span className="flex items-center font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                <Hash className="w-3 h-3 mr-1" /> {event.event_code}
              </span>
            </div>
          </div>

          <Button variant="secondary" onClick={() => alert("Функция экспорта в CSV будет доступна в полной версии")}>
            <Download className="w-4 h-4 mr-2" /> Скачать отчет
          </Button>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

        {/* Real-time Status */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full -mr-16 -mt-16 blur-xl"></div>
                <h3 className="text-slate-400 text-sm font-medium mb-1">Активных участников</h3>
                <div className="flex items-end gap-3">
                    <span className="text-4xl font-bold text-white">{stats.active_participants}</span>
                    <span className="text-green-400 text-sm mb-1 flex items-center">
                         <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span> Online
                    </span>
                </div>
                <div className="mt-4 text-xs text-slate-500">
                    Всего зарегистрировано: {stats.total_participants}
                </div>
            </Card>

            <Card className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full -mr-16 -mt-16 blur-xl"></div>
                <h3 className="text-slate-400 text-sm font-medium mb-1">Средний балл</h3>
                <div className="flex items-end gap-3">
                    <span className="text-4xl font-bold text-white">{stats.average_score}</span>
                    <span className="text-slate-500 text-sm mb-1">/ 100</span>
                </div>
                <div className="mt-4 w-full bg-slate-800 rounded-full h-1.5">
                    <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${stats.average_score}%` }}></div>
                </div>
            </Card>

            {/* Activity Log */}
            <Card className="md:col-span-2">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-400" /> Лента событий
                </h3>
                <div className="space-y-3">
                    {stats.activity_log.map((log, idx) => (
                        <div key={idx} className="flex items-start gap-3 text-sm pb-3 border-b border-slate-800 last:border-0 last:pb-0">
                            <span className="text-slate-500 font-mono whitespace-nowrap">{log.time}</span>
                            <span className="text-slate-300">{log.message}</span>
                        </div>
                    ))}
                </div>
            </Card>
        </div>

        {/* Leaderboard */}
        <div className="lg:col-span-1">
            <Card className="h-full">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-400" /> Таблица лидеров
                </h3>
                <div className="space-y-4">
                    {stats.leaderboard.map((user, index) => (
                        <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-800">
                            <div className="flex items-center gap-3">
                                <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold
                                    ${index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                                      index === 1 ? 'bg-slate-300/20 text-slate-300' :
                                      index === 2 ? 'bg-amber-700/20 text-amber-600' : 'bg-slate-800 text-slate-500'}`}>
                                    {index + 1}
                                </div>
                                <span className="text-white font-medium">{user.username}</span>
                            </div>
                            <span className="text-primary-400 font-bold">{user.score}</span>
                        </div>
                    ))}
                </div>
                <Button variant="ghost" className="w-full mt-4 text-sm">Показать всех</Button>
            </Card>
        </div>
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-purple-400" /> Распределение навыков
            </h3>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={stats.skill_distribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {stats.skill_distribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }} />
                        <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </Card>

        <Card className="flex flex-col justify-center items-center text-center p-8">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <Download className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Экспорт данных</h3>
            <p className="text-slate-400 mb-6 max-w-sm">
                Скачайте полный отчет в формате CSV для анализа в Excel или Google Sheets. Включает контакты участников.
            </p>
            <Button size="lg" onClick={() => alert("Скачивание началось...")}>
                Скачать CSV файл
            </Button>
        </Card>
      </div>
    </div>
  );
};

export default EventDetails;
