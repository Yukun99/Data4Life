export type NamedItem = {
  id: number;
  name: string;
};

export type LoanStatus =
  | 'BORROWED'
  | 'RETURNED'
  | 'OVERDUE'
  | 'UNPAID'
  | 'PAID'
  | 'FORGIVEN'
  | 'RESERVED'
  | 'EXPIRED'
  | 'QUEUED'
  | 'REMOVED';

export type Loan = {
  id: number;
  isbn: string;
  title: string;
  author: string;
  genre: string;
  borrowedAt: string | null;
  dueAt: string | null;
  reservedAt: string | null;
  reservedUntil: string | null;
  returnedAt: string | null;
  status: LoanStatus;
  overdueDays: number;
  fine: number;
  fee: number;
};
