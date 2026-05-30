import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Auth from './Auth';
import { login } from '../services/api';
import { UserRole } from '../types';

vi.mock('../services/api', () => ({
  login: vi.fn(),
}));

const mockLogin = vi.mocked(login);

function renderLogin(onLogin = vi.fn()) {
  return render(
    <MemoryRouter>
      <Auth type="login" onLogin={onLogin} />
    </MemoryRouter>
  );
}

describe('Auth (login)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('отображает форму входа', () => {
    renderLogin();

    expect(screen.getByRole('heading', { name: 'С возвращением' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Например: organizer_demo')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Войти' })).toBeInTheDocument();
  });

  it('показывает ошибку при неудачной авторизации', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Неверный логин или пароль'));
    const user = userEvent.setup();

    renderLogin();

    await user.type(screen.getByPlaceholderText('Например: organizer_demo'), 'wrong_user');
    await user.type(screen.getByPlaceholderText('••••••••'), 'wrong_pass');
    await user.click(screen.getByRole('button', { name: 'Войти' }));

    await waitFor(() => {
      expect(screen.getByText('Неверный логин или пароль')).toBeInTheDocument();
    });
  });

  it('вызывает onLogin при успешном входе', async () => {
    const onLogin = vi.fn();
    mockLogin.mockResolvedValueOnce({
      id: 1,
      username: 'organizer_demo',
      email: 'demo@example.com',
      role: UserRole.ADMIN,
    });
    const user = userEvent.setup();

    renderLogin(onLogin);

    await user.type(screen.getByPlaceholderText('Например: organizer_demo'), 'organizer_demo');
    await user.type(screen.getByPlaceholderText('••••••••'), 'secret');
    await user.click(screen.getByRole('button', { name: 'Войти' }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('organizer_demo', 'secret');
      expect(onLogin).toHaveBeenCalledWith(
        expect.objectContaining({ username: 'organizer_demo', role: UserRole.ADMIN })
      );
    });
  });
});
