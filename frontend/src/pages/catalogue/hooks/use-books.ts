import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  BookFilter,
  fetchBooks,
  goTo,
  selectCatalogue,
  setFilter,
  setSize,
  SortKey,
  switchSort,
  toggleSort,
} from '@/store/catalogue-slice';
import { useCallback, useEffect } from 'react';

const useBooks = () => {
  const dispatch = useAppDispatch();
  const catalogue = useAppSelector(selectCatalogue);
  const { page, size, sort, filter } = catalogue;

  useEffect(() => {
    dispatch(fetchBooks());
  }, [dispatch, page, size, sort, filter]);

  const reload = useCallback(() => {
    dispatch(fetchBooks());
  }, [dispatch]);

  return {
    ...catalogue,
    goTo: (target: number) => dispatch(goTo(target)),
    setSize: (value: number) => dispatch(setSize(value)),
    applyFilter: (value: BookFilter) => dispatch(setFilter(value)),
    toggleSort: (key: SortKey) => dispatch(toggleSort(key)),
    switchSort: (key: SortKey) => dispatch(switchSort(key)),
    reload,
  };
};

export default useBooks;
