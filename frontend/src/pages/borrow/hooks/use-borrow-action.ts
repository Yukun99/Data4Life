import { BorrowBook, borrowBook, reserveBook, selectBorrow } from '@/store/borrow-slice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useState } from 'react';

export type BorrowAction = 'borrow' | 'reserve';

type Target = { book: BorrowBook; action: BorrowAction };

type UseBorrowActionParams = {
  onDone: () => void;
};

const dialogText = ({ book, action }: Target) => {
  if (action === 'reserve' && book.stock === 0) {
    return {
      title: `Join the queue for ${book.title}?`,
      body: `Pay $5.00 to join the queue. You will be number ${book.queueLength + 1}. The 7 days start when a copy is ready.`,
      confirmLabel: 'Pay and join',
    };
  }
  if (action === 'reserve') {
    return {
      title: `Reserve ${book.title}?`,
      body: 'Pay $5.00 to hold a copy for 7 days.',
      confirmLabel: 'Pay and reserve',
    };
  }
  return {
    title: `Borrow ${book.title}?`,
    body:
      book.holding === 'RESERVED'
        ? 'This turns your reservation into a loan due in 14 days.'
        : 'Due back in 14 days.',
    confirmLabel: 'Borrow',
  };
};

const useBorrowAction = ({ onDone }: UseBorrowActionParams) => {
  const dispatch = useAppDispatch();
  const { actingIsbn } = useAppSelector(selectBorrow);
  const [target, setTarget] = useState<Target | null>(null);
  const [text, setText] = useState({ title: '', body: '', confirmLabel: '' });
  const [error, setError] = useState('');

  const open = (book: BorrowBook, action: BorrowAction) => {
    setTarget({ book, action });
    setText(dialogText({ book, action }));
    setError('');
  };

  const cancel = () => setTarget(null);

  const confirm = async () => {
    if (!target) {
      return;
    }
    setError('');
    const thunk = target.action === 'borrow' ? borrowBook : reserveBook;
    try {
      await dispatch(thunk(target.book.isbn)).unwrap();
      setTarget(null);
      onDone();
    } catch (err) {
      setError(String(err));
    }
  };

  return {
    target,
    text,
    error,
    saving: actingIsbn !== null,
    open,
    cancel,
    confirm,
  };
};

export default useBorrowAction;
