import { resizeColumns } from '@/common/components/data-table/sort';
import { PointerEvent } from 'react';

type UseColumnResizeParams<C extends string> = {
  order: C[];
  widths: Record<C, number>;
  onChange: (widths: Record<C, number>) => void;
  onCommit: (widths: Record<C, number>) => void;
};

const useColumnResize = <C extends string>({
  order,
  widths,
  onChange,
  onCommit,
}: UseColumnResizeParams<C>) => {
  const startResize = (key: C) => (event: PointerEvent<HTMLElement>) => {
    event.preventDefault();
    const startX = event.clientX;
    const tableWidth = event.currentTarget.closest('table')?.getBoundingClientRect().width || 1;
    let latest = widths;
    const move = (e: globalThis.PointerEvent) => {
      const delta = ((e.clientX - startX) / tableWidth) * 100;
      latest = resizeColumns({ order, widths, key, delta });
      onChange(latest);
    };
    const stop = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', stop);
      if (latest !== widths) {
        onCommit(latest);
      }
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop);
  };

  return { startResize };
};

export default useColumnResize;
