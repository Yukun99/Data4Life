import { apiFetch, errorMessage } from '@/common/utils/api';
import { useEffect, useState } from 'react';

export type LoanStatus = 'BORROWED' | 'RETURNED' | 'OVERDUE' | 'UNPAID' | 'PAID';

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

export type HistoryStats = {
  booksBorrowed: number;
  favouriteGenre: string | null;
  favouriteAuthor: string | null;
  totalOverdueFines: number;
};

export type History = {
  stats: HistoryStats;
  loans: Loan[];
};

const useHistory = () => {
  const [history, setHistory] = useState<History | null>(null);
  const [error, setError] = useState('');
  const [payingId, setPayingId] = useState<number | null>(null);
  const [payingAll, setPayingAll] = useState(false);

  useEffect(() => {
    let active = true;
    apiFetch<History>('/api/loans')
      .then((result) => active && setHistory(result))
      .catch((err) => active && setError(errorMessage(err)));
    return () => {
      active = false;
    };
  }, []);

  const post = async (path: string) => {
    setError('');
    try {
      setHistory(await apiFetch<History>(path, { method: 'POST' }));
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const pay = async (id: number) => {
    setPayingId(id);
    await post(`/api/loans/${id}/pay`);
    setPayingId(null);
  };

  const payAll = async () => {
    setPayingAll(true);
    await post('/api/loans/pay-all');
    setPayingAll(false);
  };

  return { history, loading: !history && !error, error, payingId, payingAll, pay, payAll };
};

export default useHistory;
