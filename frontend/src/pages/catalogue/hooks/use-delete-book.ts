import { useAppDispatch } from '@/store/hooks';
import { Book, deleteBook } from '@/store/catalogue-slice';
import { useState } from 'react';

type UseDeleteBookParams = {
  onDeleted: () => void;
};

const useDeleteBook = ({ onDeleted }: UseDeleteBookParams) => {
  const dispatch = useAppDispatch();
  const [target, setTarget] = useState<Book | null>(null);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const open = (book: Book) => {
    setTarget(book);
    setError('');
  };

  const cancel = () => setTarget(null);

  const confirm = async () => {
    if (!target) {
      return;
    }
    setError('');
    setDeleting(true);
    try {
      await dispatch(deleteBook(target.isbn)).unwrap();
      setTarget(null);
      onDeleted();
    } catch (err) {
      setError(String(err));
    } finally {
      setDeleting(false);
    }
  };

  return { target, error, deleting, open, cancel, confirm };
};

export default useDeleteBook;
