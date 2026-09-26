import { ReactNode } from 'react';

export type SortDir = 'asc' | 'desc';

export type SortState<S extends string> = { key: S; dir: SortDir } | null;

export type HeaderSpec<S extends string> = { label: string; sortKey?: S };

export type ColumnSpec<Row, C extends string, S extends string> = {
  key: C;
  headers: HeaderSpec<S>[];
  lines?: (row: Row) => string[];
  render?: (row: Row) => ReactNode;
};

export type FilterOption = { value: string; label: string };

export type FilterField<K extends string> = {
  key: K;
  label: string;
  testId: string;
  options: FilterOption[];
};

export const PAGE_SIZES = [10, 20, 50];

/** Turns plain values into filter options whose label is the value itself. */
export const plainOptions = (values: (string | number)[] = []): FilterOption[] =>
  values.map((value) => ({ value: String(value), label: String(value) }));
