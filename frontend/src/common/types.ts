export type NamedItem = {
  id: number;
  name: string;
};

export type LoanStatus = 'BORROWED' | 'RETURNED' | 'OVERDUE' | 'UNPAID' | 'PAID' | 'FORGIVEN';

export type Loan = {
  id: number;
  isbn: string;
  title: string;
  author: string;
  genre: string;
  borrowedAt: string;
  dueAt: string;
  returnedAt: string | null;
  status: LoanStatus;
  overdueDays: number;
  fine: number;
};
