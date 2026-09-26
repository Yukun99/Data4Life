import { NamedItem } from '@/common/types';
import { Book } from '@/store/catalogue-slice';

export type BookFields = {
  isbn: string;
  title: string;
  author: string;
  genre: NamedItem | null;
  language: NamedItem | null;
  amount: string;
};

export type BookErrors = Record<keyof BookFields, string>;

export type Conflict = {
  sourceIsbn: string;
  source: BookFields;
  sourceOnLoan: number;
  target: Book;
};
