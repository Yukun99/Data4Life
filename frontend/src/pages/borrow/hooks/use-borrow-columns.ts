import {
  BorrowColumnWidths,
  fetchBorrowColumnWidths,
  saveBorrowColumnWidths,
  selectBorrow,
  setColumnWidths,
} from '@/store/borrow-slice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useEffect } from 'react';

const useBorrowColumns = () => {
  const dispatch = useAppDispatch();
  const widths = useAppSelector(selectBorrow).columnWidths;

  useEffect(() => {
    dispatch(fetchBorrowColumnWidths());
  }, [dispatch]);

  return {
    widths,
    onWidthsChange: (next: BorrowColumnWidths) => dispatch(setColumnWidths(next)),
    onWidthsCommit: (next: BorrowColumnWidths) => dispatch(saveBorrowColumnWidths(next)),
  };
};

export default useBorrowColumns;
