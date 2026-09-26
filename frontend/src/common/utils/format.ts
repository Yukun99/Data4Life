import { LoanStatus } from '@/common/types';
import { ChipProps } from '@mui/material/Chip';

const money = new Intl.NumberFormat('en-SG', { style: 'currency', currency: 'SGD' });

export const formatMoney = (value: number) => money.format(value);

export const formatDate = (iso: string) => new Date(iso).toLocaleDateString();

export const formatDays = (count: number) => `${count} ${count === 1 ? 'day' : 'days'}`;

/** Whole days from now until the given time, rounded up. */
export const daysUntil = (iso: string, now = new Date()) =>
  Math.ceil((new Date(iso).getTime() - now.getTime()) / 86400000);

export const statusLabel: Record<LoanStatus, string> = {
  BORROWED: 'Borrowed',
  RETURNED: 'Returned',
  OVERDUE: 'Overdue',
  UNPAID: 'Unpaid',
  PAID: 'Paid',
  FORGIVEN: 'Forgiven',
};

export const chipColor: Record<LoanStatus, ChipProps['color']> = {
  BORROWED: 'primary',
  RETURNED: 'success',
  OVERDUE: 'error',
  UNPAID: 'warning',
  PAID: 'default',
  FORGIVEN: 'info',
};
