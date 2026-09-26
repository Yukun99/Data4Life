import { fetchHistory, payAllFines, payLoan, selectHistory } from '@/store/history-slice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useEffect } from 'react';

const useHistory = () => {
  const dispatch = useAppDispatch();
  const state = useAppSelector(selectHistory);

  useEffect(() => {
    dispatch(fetchHistory());
  }, [dispatch]);

  return {
    ...state,
    pay: (id: number) => dispatch(payLoan(id)),
    payAll: () => dispatch(payAllFines()),
  };
};

export default useHistory;
