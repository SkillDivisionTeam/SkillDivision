import { Event, EventStats } from '../types';

function escapeCsvField(value: string | number): string {
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function row(fields: (string | number)[]): string {
  return fields.map(escapeCsvField).join(',');
}

export function buildEventReportCsv(event: Event, stats: EventStats): string {
  const lines: string[] = [];

  lines.push('Раздел,Поле,Значение');
  lines.push(row(['Мероприятие', 'Название', event.title]));
  lines.push(row(['Мероприятие', 'Дата', event.date]));
  lines.push(row(['Мероприятие', 'Код', event.event_code]));
  lines.push(row(['Мероприятие', 'Статус', event.is_active ? 'Активно' : 'Запланировано']));
  lines.push(row(['Сводка', 'Участников всего', stats.total_participants]));
  lines.push(row(['Сводка', 'Активных', stats.active_participants]));
  lines.push(row(['Сводка', 'Средний балл', stats.average_score]));
  lines.push('');

  lines.push('Лидерборд,Место,Участник,Балл');
  stats.leaderboard.forEach((entry, index) => {
    lines.push(row(['', index + 1, entry.username, entry.score]));
  });
  lines.push('');

  lines.push('Навыки,Уровень,Количество');
  stats.skill_distribution.forEach((item) => {
    lines.push(row(['', item.name, item.value]));
  });
  lines.push('');

  lines.push('Активность,Время,Событие');
  stats.activity_log.forEach((log) => {
    lines.push(row(['', log.time, log.message]));
  });

  return `\uFEFF${lines.join('\r\n')}`;
}

export function downloadCsv(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportEventReport(event: Event, stats: EventStats): void {
  const csv = buildEventReportCsv(event, stats);
  const safeCode = event.event_code.replace(/[^\w-]/g, '_');
  downloadCsv(csv, `event_${safeCode}_report.csv`);
}
