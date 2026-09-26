import {
  ColumnKey,
  fetchColumnWidths,
  resizeColumns,
  saveColumnWidths,
  selectCatalogue,
  setColumnWidths,
} from '@/store/catalogue-slice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { PointerEvent, useEffect } from 'react';

const useColumnResize = () => {
  const dispatch = useAppDispatch();
  const widths = useAppSelector(selectCatalogue).columnWidths;

  useEffect(() => {
    dispatch(fetchColumnWidths());
  }, [dispatch]);

  const startResize = (key: ColumnKey) => (event: PointerEvent<HTMLElement>) => {
    event.preventDefault();
    const startX = event.clientX;
    const tableWidth = event.currentTarget.closest('table')?.getBoundingClientRect().width || 1;
    let latest = widths;
    const move = (e: globalThis.PointerEvent) => {
      const delta = ((e.clientX - startX) / tableWidth) * 100;
      latest = resizeColumns({ widths, key, delta });
      dispatch(setColumnWidths(latest));
    };
    const stop = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', stop);
      if (latest !== widths) {
        dispatch(saveColumnWidths(latest));
      }
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop);
  };

  return { widths, startResize };
};

export default useColumnResize;
