import { Event, User, UserRole, EventStats } from '../types';

// Mock Data
const MOCK_USER: User = {
  id: 1,
  username: "organizer_demo",
  email: "demo@skilldivision.com",
  role: UserRole.ADMIN,
  avatar: "https://picsum.photos/200/200",
  skills_profile: [
    { topic: "Python", score: 85, max_score: 100 },
    { topic: "React", score: 70, max_score: 100 },
    { topic: "Docker", score: 90, max_score: 100 },
    { topic: "SQL", score: 65, max_score: 100 },
    { topic: "System Design", score: 50, max_score: 100 },
  ]
};

const MOCK_EVENTS: Event[] = [
  { id: 1, title: "Python Conf 2024", date: "2024-10-15", event_code: "PY24", is_active: true, participants_count: 120, description: "Ежегодная конференция разработчиков Python. Квиз по асинхронности и типизации." },
  { id: 2, title: "DevOps Summit", date: "2024-11-01", event_code: "OPS1", is_active: false, participants_count: 45, description: "Воркшопы по Docker и Kubernetes. Хакатон по настройке CI/CD." },
  { id: 3, title: "Frontend Masters", date: "2024-12-10", event_code: "FE24", is_active: true, participants_count: 200, description: "React, Vue и Angular. Глубокое погружение в современные фреймворки." },
];

// Simulated API calls
// _username переменная не используется
export const login = async (_username: string): Promise<User> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(MOCK_USER), 800);
  });
};

export const getEvents = async (): Promise<Event[]> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(MOCK_EVENTS), 600);
  });
};

export const getEventById = async (id: number): Promise<Event | undefined> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(MOCK_EVENTS.find(e => e.id === id));
    }, 500);
  });
};

// _id переменная не используется
export const getEventStats = async (_id: number): Promise<EventStats> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        active_participants: Math.floor(Math.random() * 50) + 10,
        total_participants: Math.floor(Math.random() * 200) + 50,
        average_score: Math.floor(Math.random() * 30) + 60,
        leaderboard: [
          { username: "dev_alex", score: 1250 },
          { username: "maria_code", score: 1100 },
          { username: "pythonista", score: 950 },
          { username: "docker_master", score: 920 },
          { username: "js_wizard", score: 880 },
        ],
        skill_distribution: [
          { name: "Junior", value: 25 },
          { name: "Middle", value: 55 },
          { name: "Senior", value: 20 },
        ],
        activity_log: [
          { time: "10:45", message: "@dev_alex завершил квиз 'AsyncIO'" },
          { time: "10:44", message: "@maria_code присоединился к событию" },
          { time: "10:42", message: "Новый рекорд в категории 'SQL'" },
          { time: "10:40", message: "@user123 начал выполнение теста" },
          { time: "10:35", message: "@pythonista занял 3 место" },
        ]
      });
    }, 800);
  });
};

export const createEvent = async (event: Omit<Event, 'id' | 'participants_count'>): Promise<Event> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        ...event,
        id: Math.floor(Math.random() * 1000),
        participants_count: 0
      });
    }, 1000);
  });
};