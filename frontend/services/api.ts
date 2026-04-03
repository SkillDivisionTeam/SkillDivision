/// <reference types="vite/client" />
import { Event, EventStats, User, UserRole } from '../types';

const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const API_URL = rawUrl.endsWith('/') ? rawUrl.slice(0, -1) : rawUrl;

// === Базовая функция запроса с Токеном ===
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('auth_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  // Если токен есть, прикрепляем его
  if (token) {
    headers['Authorization'] = `Token ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    // Если токен протух (401), разлогиниваем
    if (response.status === 401) {
      localStorage.removeItem('auth_token');
      // Опционально: window.location.href = '/login';
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || errorData.non_field_errors || `API Error: ${response.statusText}`);
  }

  return response.json();
}

// === Методы API ===

export const getEvents = async (): Promise<Event[]> => {
  return request<Event[]>('/events/');
};

export const getEventById = async (id: number): Promise<Event> => {
  return request<Event>(`/events/${id}/`);
};

export const getEventStats = async (id: number): Promise<EventStats> => {
  return request<EventStats>(`/events/${id}/stats/`);
};

export const createEvent = async (eventData: Partial<Event>): Promise<Event> => {
  return request<Event>('/events/', {
    method: 'POST',
    body: JSON.stringify(eventData),
  });
};

// === Авторизация ===

export const login = async (username: string, password?: string): Promise<User> => {
  // Отправляем реальный запрос на бэкенд
  const response = await request<{
    token: string;
    user_id: number;
    username: string;
    email: string;
    role: string;
  }>('/login/', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });

  // Сохраняем токен
  localStorage.setItem('auth_token', response.token);

  // Возвращаем объект User для состояния React
  return {
    id: response.user_id,
    username: response.username,
    email: response.email,
    role: response.role as UserRole,
    // Генерируем аватарку, так как на бэке пока нет загрузки файлов
    avatar: `https://ui-avatars.com/api/?name=${response.username}&background=0D8ABC&color=fff`
  };
};

export const logout = () => {
  localStorage.removeItem('auth_token');
};
