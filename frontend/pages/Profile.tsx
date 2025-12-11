import React, { useEffect, useState, useMemo } from 'react';
import { Mail, Shield, Calendar, Users, Settings, Target, BarChart3, Clock, ChevronRight, Hash, Loader2, Activity } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { User as UserType, Event } from '../types';
import { Card, Badge } from '../components/UI';
import { getEvents } from '../services/mockApi';

interface ProfileProps {
  user: UserType;
}

const Profile: React.FC<ProfileProps> = ({ user }) => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getEvents();
        setEvents(data);
      } catch (error) {
        console.error("Failed to load profile stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getRoleName = (role: string) => {
    switch(role) {
      case 'admin': return 'АДМИНИСТРАТОР';
      case 'hr': return 'HR-СПЕЦИАЛИСТ';
      default: return 'ПОЛЬЗОВАТЕЛЬ';
    }
  }

  const stats = useMemo(() => {
    if (events.length === 0) {
      return { totalEvents: 0, totalParticipants: 0, avgScore: 0, topEvent: 'Нет данных' };
    }

    const totalParticipants = events.reduce((acc, curr) => acc + curr.participants_count, 0);
    
    const topEventObj = events.reduce((prev, current) => 
      (prev.participants_count > current.participants_count) ? prev : current
    );

    return {
      totalEvents: events.length,
      totalParticipants: totalParticipants,
      avgScore: 78, // Заглушка
      topEvent: topEventObj.title
    };
  }, [events]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-200px)]">
        <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ЛЕВАЯ КОЛОНКА: Личная карточка */}
        <div className="lg:col-span-1">
          <Card className="h-full border-t-4 border-t-primary-500">
            <div className="flex flex-col items-center text-center">
              <div className="w-32 h-32 rounded-full bg-slate-800 p-1 mb-4 shadow-xl">
                <img 
                  src={user.avatar || `https://ui-avatars.com/api/?name=${user.username}&background=0f172a&color=fff`} 
                  alt="Profile" 
                  className="w-full h-full rounded-full object-cover border-2 border-slate-700"
                />
              </div>
              <h2 className="text-2xl font-bold text-white mb-1">@{user.username}</h2>
              <Badge color={user.role === 'admin' ? 'red' : 'purple'}>
                {getRoleName(user.role)}
              </Badge>

              <div className="w-full mt-8 space-y-4 text-left">
                <div className="flex items-center text-slate-400 p-3 bg-slate-800/50 rounded-lg">
                  <Mail className="w-5 h-5 mr-3 text-slate-500" />
                  <span className="text-sm truncate">{user.email}</span>
                </div>
                <div className="flex items-center text-slate-400 p-3 bg-slate-800/50 rounded-lg">
                  <Shield className="w-5 h-5 mr-3 text-slate-500" />
                  <span className="text-sm">ID: #{user.id}</span>
                </div>
                <div className="flex items-center text-slate-400 p-3 bg-slate-800/50 rounded-lg">
                  <Settings className="w-5 h-5 mr-3 text-slate-500" />
                  <span className="text-sm">Права: Организатор</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* ПРАВАЯ КОЛОНКА: Сводная аналитика */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Хедер */}
          <div className="flex flex-col sm:flex-row gap-4">
             <Card className="flex-grow bg-gradient-to-r from-slate-800 to-slate-900 border-none">
                <h3 className="text-xl font-bold text-white mb-1">Обзор платформы</h3>
                <p className="text-slate-400 text-sm">
                  Статистика в реальном времени по вашим мероприятиям.
                </p>
             </Card>
             <Card className="flex items-center justify-center px-6 min-w-[150px] border-l-4 border-l-green-500">
                <div className="text-center">
                   <div className="flex items-center justify-center gap-2 mb-1">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                      <span className="text-slate-300 font-medium text-sm">Бот</span>
                   </div>
                   <span className="font-bold text-white">Online</span>
                </div>
             </Card>
          </div>

          {/* KPI Метрики (Динамические) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700/50 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-xs uppercase font-bold">Ивенты</span>
                <Calendar className="w-4 h-4 text-primary-400" />
              </div>
              <span className="text-2xl font-bold text-white">{stats.totalEvents}</span>
              <span className="text-xs text-slate-500 mt-1">Всего создано</span>
            </div>

            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700/50 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-xs uppercase font-bold">Участники</span>
                <Users className="w-4 h-4 text-purple-400" />
              </div>
              <span className="text-2xl font-bold text-white">{stats.totalParticipants}</span>
              <span className="text-xs text-slate-500 mt-1">Всего регистраций</span>
            </div>

            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700/50 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-xs uppercase font-bold">Ср. Балл</span>
                <BarChart3 className="w-4 h-4 text-green-400" />
              </div>
              <span className="text-2xl font-bold text-white">{stats.avgScore}%</span>
              <span className="text-xs text-slate-500 mt-1">Общая успеваемость</span>
            </div>

            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700/50 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-xs uppercase font-bold">Топ Ивент</span>
                <Target className="w-4 h-4 text-orange-400" />
              </div>
              <span className="text-lg font-bold text-white truncate" title={stats.topEvent}>
                {stats.topEvent}
              </span>
              <span className="text-xs text-slate-500 mt-1">Макс. активность</span>
            </div>

          </div>

          {/* Список мероприятий (Кликабельный) */}
          <Card className="flex-grow">
            <div className="flex items-center justify-between mb-4">
               <h3 className="text-lg font-bold text-white flex items-center gap-2">
                 <Clock className="w-5 h-5 text-slate-400" />
                 Недавняя активность
               </h3>
               <Link to="/events" className="text-sm text-primary-400 hover:text-primary-300 flex items-center transition-colors">
                 Все мероприятия <ChevronRight className="w-4 h-4 ml-1" />
               </Link>
            </div>

            <div className="space-y-3">
              {events.map((event) => (
                <div 
                  key={event.id} 
                  onClick={() => navigate(`/events/${event.id}`)} // Переход к деталям
                  className="group flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-transparent hover:border-primary-500/30 hover:bg-slate-800 transition-all cursor-pointer"
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white group-hover:text-primary-400 transition-colors">
                        {event.title}
                      </span>
                      {event.is_active && (
                        <span className="flex w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      <span>{event.date}</span>
                      <span>•</span>
                      <span className="flex items-center"><Hash className="w-3 h-3 mr-1" />{event.event_code}</span>
                      <span>•</span>
                      <span>{event.participants_count} участников</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      event.is_active
                        ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                        : 'bg-slate-700 text-slate-400'
                    }`}>
                      {event.is_active ? 'Активен' : 'Завершен'}
                    </span>
                    <div className="p-2 rounded-full bg-slate-800 text-slate-400 group-hover:bg-primary-500 group-hover:text-white transition-all">
                       <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {events.length === 0 && (
               <div className="text-center py-8 text-slate-500">
                  <Activity className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  <p>Событий пока нет. Создайте первое!</p>
                  <Link to="/events/new" className="text-primary-400 text-sm mt-2 block">Создать событие</Link>
               </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;