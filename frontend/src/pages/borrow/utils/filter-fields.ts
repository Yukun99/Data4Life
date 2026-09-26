import { FilterField, plainOptions } from '@/common/components/data-table/types';
import { NamedItem } from '@/common/types';
import { BorrowFilter } from '@/store/borrow-slice';
import { FilterOptions } from '@/store/catalogue-slice';

const named = (items: NamedItem[] = []) =>
  items.map(({ id, name }) => ({ value: String(id), label: name }));

/** The filter dialog fields for the borrow page, with options from the last list response. */
export const fieldsFor = (options: FilterOptions | null): FilterField<keyof BorrowFilter>[] => [
  { key: 'isbn', label: 'ISBN', testId: 'filter-isbn', options: plainOptions(options?.isbn) },
  { key: 'title', label: 'Title', testId: 'filter-title', options: plainOptions(options?.title) },
  {
    key: 'author',
    label: 'Author',
    testId: 'filter-author',
    options: plainOptions(options?.author),
  },
  { key: 'genreId', label: 'Genre', testId: 'filter-genre', options: named(options?.genre) },
  {
    key: 'languageId',
    label: 'Language',
    testId: 'filter-language',
    options: named(options?.language),
  },
  { key: 'stock', label: 'Stock', testId: 'filter-stock', options: plainOptions(options?.stock) },
];
