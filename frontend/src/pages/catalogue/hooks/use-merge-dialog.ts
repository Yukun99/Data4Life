import { NamedItem } from '@/common/types';
import { Conflict } from '@/pages/catalogue/types';
import { useAppDispatch } from '@/store/hooks';
import { mergeBooks } from '@/store/catalogue-slice';
import { useState } from 'react';

export type MergeField = 'title' | 'author' | 'genre' | 'language';

export type Choice = 'source' | 'target' | 'custom';

export type CustomValues = {
  title: string;
  author: string;
  genre: NamedItem | null;
  language: NamedItem | null;
};

export type MergeValue = string | NamedItem | null;

type UseMergeDialogParams = {
  onMerged: () => void;
};

export const MERGE_FIELDS: MergeField[] = ['title', 'author', 'genre', 'language'];

const DEFAULT_CHOICES: Record<MergeField, Choice> = {
  title: 'source',
  author: 'source',
  genre: 'source',
  language: 'source',
};

const EMPTY_CUSTOM: CustomValues = { title: '', author: '', genre: null, language: null };

/** Reads one field of the edited (source) or existing (target) book. */
export const sideValue = (conflict: Conflict, side: 'source' | 'target', field: MergeField) =>
  side === 'source' ? conflict.source[field] : conflict.target[field];

const key = (value: MergeValue) =>
  typeof value === 'string' ? value.trim() : value ? String(value.id) : '';

/** Fields whose edited value differs from the existing book's. */
export const differingFields = (conflict: Conflict) =>
  MERGE_FIELDS.filter(
    (field) => key(sideValue(conflict, 'source', field)) !== key(sideValue(conflict, 'target', field)),
  );

const useMergeDialog = ({ onMerged }: UseMergeDialogParams) => {
  const dispatch = useAppDispatch();
  const [conflict, setConflict] = useState<Conflict | null>(null);
  const [choices, setChoices] = useState(DEFAULT_CHOICES);
  const [custom, setCustomValues] = useState(EMPTY_CUSTOM);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const differing = conflict ? differingFields(conflict) : [];
  const onLoan = conflict
    ? conflict.sourceOnLoan + conflict.target.amount - conflict.target.stock
    : 0;
  const validAmount = /^\d+$/.test(amount.trim());
  const stockAfter = validAmount ? Number(amount.trim()) - onLoan : null;

  const start = (next: Conflict) => {
    setConflict(next);
    setChoices(DEFAULT_CHOICES);
    setCustomValues(EMPTY_CUSTOM);
    setAmount(String(Number(next.source.amount.trim()) + next.target.amount));
    setError('');
  };

  const choose = (field: MergeField, choice: Choice) =>
    setChoices((current) => ({ ...current, [field]: choice }));

  const setCustom = <K extends MergeField>(field: K, value: CustomValues[K]) =>
    setCustomValues((current) => ({ ...current, [field]: value }));

  const resolve = (current: Conflict, field: MergeField): MergeValue => {
    if (!differing.includes(field) || choices[field] === 'target') {
      return sideValue(current, 'target', field);
    }
    return choices[field] === 'source' ? sideValue(current, 'source', field) : custom[field];
  };

  const cancel = () => setConflict(null);

  const confirm = async () => {
    if (!conflict) {
      return;
    }
    const values = Object.fromEntries(MERGE_FIELDS.map((f) => [f, resolve(conflict, f)]));
    if (MERGE_FIELDS.some((field) => !key(values[field]))) {
      setError('Choose a value for every field');
      return;
    }
    if (stockAfter === null || stockAfter < 0) {
      setError(`Amount must be a whole number of at least ${onLoan}`);
      return;
    }
    const request = {
      isbn: conflict.target.isbn,
      title: key(values.title),
      author: key(values.author),
      genreId: Number(key(values.genre)),
      languageId: Number(key(values.language)),
      amount: Number(amount.trim()),
    };
    setError('');
    setSaving(true);
    try {
      await dispatch(mergeBooks({ sourceIsbn: conflict.sourceIsbn, request })).unwrap();
      setConflict(null);
      onMerged();
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  };

  return {
    conflict,
    differing,
    choices,
    choose,
    custom,
    setCustom,
    amount,
    setAmount,
    onLoan,
    stockAfter,
    error,
    saving,
    start,
    cancel,
    confirm,
  };
};

export default useMergeDialog;
