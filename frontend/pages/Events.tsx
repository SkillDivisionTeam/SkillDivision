import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Calendar, Users, Hash, Loader2 } from 'lucide-react';
import { Button, Card, Badge } from '../components/UI';
import { getEvents } from '../services/api';
import { Event } from '../types';

const Events: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await getEvents();
        setEvents(data);
      } catch {
        console.error("Failed to load events");
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Управление мероприятиями</h1>
          <p className="text-slate-400 mt-1">Управляйте квизами и отслеживайте активность участников.</p>
        </div>
        <Link to="/events/new">
          <Button>
            <Plus className="w-5 h-5 mr-2" /> Создать событие
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Card
              key={event.id}
              className="hover:border-primary-500/30 transition-colors cursor-pointer group"
              onClick={() => navigate(`/events/${event.id}`)}
            >
              <div className="flex justify-between items-start mb-4">
                <Badge color={event.is_active ? 'green' : 'blue'}>
                  {event.is_active ? 'Активно' : 'Запланировано'}
                </Badge>
                <div className="flex items-center text-slate-500 text-sm font-mono bg-slate-800 px-2 py-1 rounded">
                   <Hash className="w-3 h-3 mr-1" /> {event.event_code}
                </div>
              </div>

              <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-primary-400 transition-colors">
                {event.title}
              </h3>
              <p className="text-slate-400 text-sm mb-6 line-clamp-2">
                {event.description}
              </p>

              <div className="flex justify-between items-center text-sm text-slate-500 border-t border-slate-800 pt-4">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  {event.date}
                </div>
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  {event.participants_count}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Events;
