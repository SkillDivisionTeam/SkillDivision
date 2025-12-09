import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Terminal, User, LogOut, PlusCircle, LayoutDashboard } from 'lucide-react';
import { User as UserType } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user: UserType | null;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0 flex items-center gap-2">
                <Terminal className="h-8 w-8 text-primary-500" />
                <span className="font-bold text-xl tracking-tight text-white">Skill Division</span>
              </Link>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-4">
              <Link to="/about" className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/about') ? 'text-primary-400' : 'text-slate-300 hover:text-white'}`}>
                О нас
              </Link>
              
              {user ? (
                <>
                  <Link to="/events" className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${isActive('/events') ? 'text-primary-400' : 'text-slate-300 hover:text-white'}`}>
                    <LayoutDashboard className="w-4 h-4" /> Мероприятия
                  </Link>
                  <Link to="/events/new" className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${isActive('/events/new') ? 'text-primary-400' : 'text-slate-300 hover:text-white'}`}>
                    <PlusCircle className="w-4 h-4" /> Создать
                  </Link>
                  <Link to="/profile" className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${isActive('/profile') ? 'text-primary-400' : 'text-slate-300 hover:text-white'}`}>
                    <User className="w-4 h-4" /> Профиль
                  </Link>
                  <button onClick={handleLogout} className="ml-4 px-4 py-2 rounded-md text-sm font-medium bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-all flex items-center gap-2">
                    <LogOut className="w-4 h-4" /> Выйти
                  </button>
                </>
              ) : (
                <div className="flex gap-2">
                  <Link to="/login" className="px-4 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white transition-colors">
                    Войти
                  </Link>
                  <Link to="/register" className="px-4 py-2 rounded-md text-sm font-medium bg-primary-600 hover:bg-primary-700 text-white transition-colors shadow-lg shadow-primary-900/50">
                    Регистрация
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
              >
                {isMobileMenuOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-slate-800 border-b border-slate-700">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link to="/about" className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-700">О нас</Link>
              {user ? (
                <>
                  <Link to="/events" className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-700">Мероприятия</Link>
                  <Link to="/events/new" className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-700">Создать событие</Link>
                  <Link to="/profile" className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-700">Профиль</Link>
                  <button onClick={handleLogout} className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-red-400 hover:text-red-300 hover:bg-slate-700">Выйти</button>
                </>
              ) : (
                <>
                  <Link to="/login" className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-700">Войти</Link>
                  <Link to="/register" className="block px-3 py-2 rounded-md text-base font-medium text-primary-400 hover:text-primary-300 hover:bg-slate-700">Регистрация</Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-slate-500" />
            <span className="text-slate-500 text-sm">© 2025 Skill Division. Все права защищены.</span>
          </div>
          <div className="flex gap-6 text-sm text-slate-500">
            <Link to="/about" className="hover:text-slate-300 transition-colors">Конфиденциальность</Link>
            <Link to="/about" className="hover:text-slate-300 transition-colors">Правила</Link>
            <Link to="/about" className="hover:text-slate-300 transition-colors">Контакты</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;