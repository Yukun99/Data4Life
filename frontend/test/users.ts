import { User } from '@/store/user-slice';

export const ada: User = {
  id: 1,
  name: 'Ada',
  email: 'ada@example.com',
  createdAt: '2026-01-15T00:00:00Z',
  admin: false,
  avatar: 'ACCOUNT',
};

export const admin: User = { ...ada, id: 2, name: 'Admin', email: 'admin@example.com', admin: true };
