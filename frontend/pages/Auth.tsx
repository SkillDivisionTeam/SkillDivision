import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Card } from '../components/UI';
import { login } from '../services/api';
import { User } from '../types';

interface AuthPageProps {
  type: 'login' | 'register';
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthPageProps> = ({ type, onLogin }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: '', password: '', email: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (type === 'login') {
        // Передаем и логин, и пароль
        const user = await login(formData.username, formData.password);
        onLogin(user);
        navigate('/profile');
      } else {
        // Регистрацию пока оставим как заглушку
        alert("Регистрация доступна только через администратора или бота. Попробуйте войти.");
        // В будущем можно добавить эндпоинт /register/ на бэкенде
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка авторизации. Проверьте логин и пароль.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white">
            {type === 'login' ? 'С возвращением' : 'Создание аккаунта'}
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            {type === 'login' 
              ? 'Введите свои данные для доступа к панели управления.' 
              : 'Присоединяйтесь к сообществу Skill Division сегодня.'}
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Имя пользователя"
              name="username"
              type="text"
              required
              value={formData.username}
              onChange={handleChange}
              placeholder="Например: organizer_demo"
            />
            
            {type === 'register' && (
               <Input
               label="Email"
               name="email"
               type="email"
               required
               value={formData.email}
               onChange={handleChange}
               placeholder="you@example.com"
             />
            )}

            <Input
              label="Пароль"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
            />

            {error && (
              <div className="p-3 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" isLoading={isLoading}>
              {type === 'login' ? 'Войти' : 'Зарегистрироваться'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Auth;