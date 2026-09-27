import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchReturnColumnWidths,
  ReturnColumnWidths,
  saveReturnColumnWidths,
  selectReturns,
  setColumnWidths,
} from '@/store/return-slice';
import { useEffect } from 'react';

const useReturnColumns = () => {
  const dispatch = useAppDispatch();
  const widths = useAppSelector(selectReturns).columnWidths;

  useEffect(() => {
    dispatch(fetchReturnColumnWidths());
  }, [dispatch]);

  return {
    widths,
    onWidthsChange: (next: ReturnColumnWidths) => dispatch(setColumnWidths(next)),
    onWidthsCommit: (next: ReturnColumnWidths) => dispatch(saveReturnColumnWidths(next)),
  };
};

export default useReturnColumns;
