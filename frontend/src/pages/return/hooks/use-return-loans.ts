import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchReturnLoans,
  goTo,
  ReturnFilter,
  ReturnSortKey,
  selectReturns,
  setFilter,
  setSize,
  switchSort,
  toggleSort,
} from '@/store/return-slice';
import { useCallback, useEffect } from 'react';

const useReturnLoans = () => {
  const dispatch = useAppDispatch();
  const returns = useAppSelector(selectReturns);
  const { page, size, sort, filter } = returns;

  useEffect(() => {
    dispatch(fetchReturnLoans());
  }, [dispatch, page, size, sort, filter]);

  const reload = useCallback(() => {
    dispatch(fetchReturnLoans());
  }, [dispatch]);

  return {
    ...returns,
    goTo: (target: number) => dispatch(goTo(target)),
    setSize: (value: number) => dispatch(setSize(value)),
    applyFilter: (value: ReturnFilter) => dispatch(setFilter(value)),
    toggleSort: (key: ReturnSortKey) => dispatch(toggleSort(key)),
    switchSort: (key: ReturnSortKey) => dispatch(switchSort(key)),
    reload,
  };
};

export default useReturnLoans;
