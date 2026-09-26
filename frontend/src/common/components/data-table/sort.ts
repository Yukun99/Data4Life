import { SortState } from '@/common/components/data-table/types';

export const MIN_COLUMN_PERCENT = 5;

/** Next sort after clicking a header: ascending, then descending, then off. */
export const cycleSort = <S extends string>(sort: SortState<S>, key: S): SortState<S> => {
  if (sort?.key !== key) {
    return { key, dir: 'asc' };
  }
  return sort.dir === 'asc' ? { key, dir: 'desc' } : null;
};

/** Sorts by a new key but keeps the current direction. */
export const keepDirSort = <S extends string>(sort: SortState<S>, key: S): SortState<S> => ({
  key,
  dir: sort?.dir ?? 'asc',
});

type ResizeColumnsParams<C extends string> = {
  order: C[];
  widths: Record<C, number>;
  key: C;
  delta: number;
};

/** Moves `delta` percent from the column after `key` into `key`, keeping both above the minimum. */
export const resizeColumns = <C extends string>({
  order,
  widths,
  key,
  delta,
}: ResizeColumnsParams<C>): Record<C, number> => {
  const next = order[order.indexOf(key) + 1];
  if (!next) {
    return widths;
  }
  const left = widths[key];
  const right = widths[next];
  const applied = Math.max(MIN_COLUMN_PERCENT - left, Math.min(delta, right - MIN_COLUMN_PERCENT));
  const tenth = (value: number) => Math.round(value * 10) / 10;
  const out = { ...widths };
  out[key] = tenth(left + applied);
  out[next] = tenth(right - applied);
  return out;
};
