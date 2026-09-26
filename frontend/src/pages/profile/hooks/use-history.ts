import { fetchHistory, Loan, payAllFines, payLoan, selectHistory } from '@/store/history-slice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useEffect, useState } from 'react';

const useHistory = () => {
  const dispatch = useAppDispatch();
  const state = useAppSelector(selectHistory);
  const [pending, setPending] = useState<Loan | 'all' | null>(null);

  useEffect(() => {
    dispatch(fetchHistory());
  }, [dispatch]);

  const confirm = async () => {
    if (!pending) {
      return;
    }
    const paid =
      pending === 'all'
        ? payAllFines.fulfilled.match(await dispatch(payAllFines()))
        : payLoan.fulfilled.match(await dispatch(payLoan(pending.id)));
    if (paid) {
      setPending(null);
    }
  };

  return {
    ...state,
    pending,
    askPay: (loan: Loan) => setPending(loan),
    askPayAll: () => setPending('all'),
    cancel: () => setPending(null),
    confirm,
  };
};

export default useHistory;
