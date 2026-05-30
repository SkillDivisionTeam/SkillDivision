import { describe, it, expect } from 'vitest';
import { buildEventReportCsv } from './exportCsv';
import { Event, EventStats } from '../types';

const event: Event = {
  id: 1,
  title: 'Python Camp',
  date: '2024-07-15',
  event_code: 'PY2024',
  is_active: true,
};

const stats: EventStats = {
  active_participants: 5,
  total_participants: 10,
  average_score: 75.5,
  leaderboard: [
    { username: 'alice', score: 90 },
    { username: 'bob', score: 80 },
  ],
  skill_distribution: [
    { name: 'Junior', value: 3 },
    { name: 'Middle', value: 5 },
  ],
  activity_log: [{ time: '14:30', message: '@alice набрал 90 очков' }],
};

describe('exportCsv', () => {
  it('формирует CSV с данными мероприятия и статистикой', () => {
    const csv = buildEventReportCsv(event, stats);

    expect(csv).toContain('Python Camp');
    expect(csv).toContain('PY2024');
    expect(csv).toContain('alice');
    expect(csv).toContain('Junior');
    expect(csv).toContain('@alice набрал 90 очков');
  });

  it('экранирует поля с запятыми и кавычками', () => {
    const csv = buildEventReportCsv(
      { ...event, title: 'Event, "Special"' },
      stats
    );

    expect(csv).toContain('"Event, ""Special"""');
  });
});
