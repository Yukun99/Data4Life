import {
  ColumnWidths,
  fetchColumnWidths,
  saveColumnWidths,
  selectCatalogue,
  setColumnWidths,
} from '@/store/catalogue-slice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useEffect } from 'react';

const useCatalogueColumns = () => {
  const dispatch = useAppDispatch();
  const widths = useAppSelector(selectCatalogue).columnWidths;

  useEffect(() => {
    dispatch(fetchColumnWidths());
  }, [dispatch]);

  return {
    widths,
    onWidthsChange: (next: ColumnWidths) => dispatch(setColumnWidths(next)),
    onWidthsCommit: (next: ColumnWidths) => dispatch(saveColumnWidths(next)),
  };
};

export default useCatalogueColumns;
