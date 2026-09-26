import { BookErrors, BookFields, Conflict } from '@/pages/catalogue/types';
import { useAppDispatch } from '@/store/hooks';
import {
  Book,
  BookRequest,
  createBook,
  fetchBook,
  RequestFailure,
  updateBook,
} from '@/store/catalogue-slice';
import { useState } from 'react';

type UseBookDialogParams = {
  onSaved: () => void;
  onConflict: (conflict: Conflict) => void;
};

const EMPTY_FIELDS: BookFields = {
  isbn: '',
  title: '',
  author: '',
  genre: null,
  language: null,
  amount: '',
};

const NO_ERRORS: BookErrors = {
  isbn: '',
  title: '',
  author: '',
  genre: '',
  language: '',
  amount: '',
};

/** Checks the form; returns an error message per field, empty when the field is valid. */
export const validate = (fields: BookFields, onLoan: number): BookErrors => {
  const isbn = fields.isbn.trim();
  const amount = fields.amount.trim();
  let amountError = '';
  if (!/^\d+$/.test(amount)) {
    amountError = 'Amount must be a whole number';
  } else if (Number(amount) < onLoan) {
    amountError = `Amount cannot be below the ${onLoan} on loan`;
  }
  return {
    isbn: !isbn ? 'ISBN is required' : isbn.length > 20 ? 'ISBN is at most 20 characters' : '',
    title: fields.title.trim() ? '' : 'Title is required',
    author: fields.author.trim() ? '' : 'Author is required',
    genre: fields.genre ? '' : 'Genre is required',
    language: fields.language ? '' : 'Language is required',
    amount: amountError,
  };
};

/** Turns validated form fields into the request body. */
export const toRequest = (fields: BookFields): BookRequest => ({
  isbn: fields.isbn.trim(),
  title: fields.title.trim(),
  author: fields.author.trim(),
  genreId: fields.genre?.id ?? 0,
  languageId: fields.language?.id ?? 0,
  amount: Number(fields.amount.trim()),
});

const toFields = (book: Book): BookFields => ({
  isbn: book.isbn,
  title: book.title,
  author: book.author,
  genre: book.genre,
  language: book.language,
  amount: String(book.amount),
});

const useBookDialog = ({ onSaved, onConflict }: UseBookDialogParams) => {
  const dispatch = useAppDispatch();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Book | null>(null);
  const [fields, setFields] = useState<BookFields>(EMPTY_FIELDS);
  const [errors, setErrors] = useState<BookErrors>(NO_ERRORS);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const onLoan = editing ? editing.amount - editing.stock : 0;

  const openDialog = (book?: Book) => {
    setEditing(book ?? null);
    setFields(book ? toFields(book) : EMPTY_FIELDS);
    setErrors(NO_ERRORS);
    setError('');
    setOpen(true);
  };

  const setField = <K extends keyof BookFields>(key: K, value: BookFields[K]) =>
    setFields((current) => ({ ...current, [key]: value }));

  const close = () => setOpen(false);

  const handoff = async (source: Book, request: BookRequest) => {
    try {
      const target = await dispatch(fetchBook(request.isbn)).unwrap();
      setOpen(false);
      onConflict({ sourceIsbn: source.isbn, source: fields, sourceOnLoan: onLoan, target });
    } catch (err) {
      setError(String(err));
    }
  };

  const submit = async () => {
    setError('');
    const found = validate(fields, onLoan);
    setErrors(found);
    if (Object.values(found).some(Boolean)) {
      return;
    }
    const request = toRequest(fields);
    setSaving(true);
    try {
      if (editing) {
        await dispatch(updateBook({ isbn: editing.isbn, request })).unwrap();
      } else {
        await dispatch(createBook(request)).unwrap();
      }
      setOpen(false);
      onSaved();
    } catch (err) {
      const failure = typeof err === 'string' ? { status: 0, message: err } : (err as RequestFailure);
      if (editing && failure.status === 409 && request.isbn !== editing.isbn) {
        await handoff(editing, request);
      } else {
        setError(failure.message);
      }
    } finally {
      setSaving(false);
    }
  };

  return {
    open,
    editing,
    fields,
    setField,
    errors,
    error,
    saving,
    onLoan,
    openDialog,
    close,
    submit,
  };
};

export default useBookDialog;
