import { SortState } from '@/common/components/data-table/types';

type BuildQueryParams<K extends string, S extends string> = {
  page: number;
  size: number;
  sort: SortState<S>;
  filter: Record<K, string>;
  filterKeys: K[];
};

/** Builds a list query string in a fixed order: page, size, sort, dir, then set filters. */
export const buildQuery = <K extends string, S extends string>({
  page,
  size,
  sort,
  filter,
  filterKeys,
}: BuildQueryParams<K, S>) => {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (sort) {
    params.append('sort', sort.key);
    params.append('dir', sort.dir);
  }
  filterKeys.filter((key) => filter[key] !== '').forEach((key) => params.append(key, filter[key]));
  return params.toString();
};
