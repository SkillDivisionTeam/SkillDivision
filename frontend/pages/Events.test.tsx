import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Events from './Events';
import { getEvents } from '../services/api';

vi.mock('../services/api', () => ({
  getEvents: vi.fn(),
}));

const mockGetEvents = vi.mocked(getEvents);

const sampleEvents = [
  {
    id: 1,
    title: 'Python Summer Camp',
    date: '2024-07-15',
    event_code: 'PY2024',
    is_active: true,
    description: 'Квиз по Python',
    participants_count: 42,
  },
  {
    id: 2,
    title: 'DevOps Meetup',
    date: '2024-08-01',
    event_code: 'DO2024',
    is_active: false,
    description: 'Docker и CI/CD',
    participants_count: 18,
  },
];

describe('Events (dashboard)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('отображает заголовок панели управления', async () => {
    mockGetEvents.mockResolvedValueOnce([]);
    render(
      <MemoryRouter>
        <Events />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Управление мероприятиями' })).toBeInTheDocument();
    await waitFor(() => {
      expect(mockGetEvents).toHaveBeenCalledOnce();
    });
  });

  it('рендерит карточки мероприятий после загрузки', async () => {
    mockGetEvents.mockResolvedValueOnce(sampleEvents);
    render(
      <MemoryRouter>
        <Events />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Python Summer Camp')).toBeInTheDocument();
      expect(screen.getByText('DevOps Meetup')).toBeInTheDocument();
    });

    expect(screen.getByText('PY2024')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });
});
