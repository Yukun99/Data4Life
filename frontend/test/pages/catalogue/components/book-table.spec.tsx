import BookTable from '@/pages/catalogue/components/book-table';
import { DEFAULT_COLUMN_WIDTHS, MIN_COLUMN_PERCENT } from '@/store/catalogue-slice';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import mockFetch from '../../../mock-fetch';
import withStore from '../../../with-store';

const book = {
  isbn: '111',
  title: 'A very long title that should be cut off with an ellipsis',
  author: 'Frank Herbert',
  genre: { id: 2, name: 'Science Fiction' },
  language: { id: 1, name: 'English' },
  amount: 3,
  stock: 2,
};

const saved = { isbn: 10, titleAuthor: 40, genreLanguage: 20, amount: 10, stock: 10, actions: 10 };

const renderTable = (stored?: typeof saved) => {
  const fetchMock = mockFetch({
    'GET /api/catalogue/columns': { status: 200, body: stored },
    'PUT /api/catalogue/columns': { status: 200, body: saved },
  });
  const { store, ui } = withStore(
    <BookTable
      books={[book]}
      sort={null}
      loading={false}
      error=""
      onToggleSort={vi.fn()}
      onSwitchSort={vi.fn()}
      onEdit={vi.fn()}
      onDelete={vi.fn()}
    />,
  );
  render(ui);
  return { store, fetchMock };
};

const drag = (key: string, from: number, to: number) => {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    width: 1000,
  } as DOMRect);
  fireEvent.pointerDown(screen.getByTestId(`resize-${key}`), { clientX: from });
  fireEvent.pointerMove(window, { clientX: to });
  fireEvent.pointerUp(window, { clientX: to });
};

describe('BookTable', () => {
  it('starts with the default widths and truncates cells', () => {
    renderTable();

    expect(screen.getByTestId('col-titleAuthor')).toHaveStyle({
      width: `${DEFAULT_COLUMN_WIDTHS.titleAuthor}%`,
    });
    expect(screen.getByText(book.title)).toHaveStyle({
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    });
    expect(screen.getByText(book.title)).toHaveAttribute('title', book.title);
  });

  it('loads saved widths from the backend', async () => {
    renderTable(saved);

    await waitFor(() =>
      expect(screen.getByTestId('col-titleAuthor')).toHaveStyle({ width: '40%' }),
    );
  });

  it('moves width between neighbours by dragging the divider and saves the result', async () => {
    const { store, fetchMock } = renderTable();

    drag('isbn', 100, 140);

    const { isbn, titleAuthor } = store.getState().catalogue.columnWidths;
    expect(isbn).toBe(DEFAULT_COLUMN_WIDTHS.isbn + 4);
    expect(titleAuthor).toBe(DEFAULT_COLUMN_WIDTHS.titleAuthor - 4);
    expect(screen.getByTestId('col-isbn')).toHaveStyle({ width: `${isbn}%` });
    await waitFor(() => {
      const call = fetchMock.mock.calls.find(([, init]) => init?.method === 'PUT');
      expect(JSON.parse(String(call?.[1]?.body))).toEqual(store.getState().catalogue.columnWidths);
    });
  });

  it('stops tracking after pointer up and never shrinks below the minimum', () => {
    const { store } = renderTable();

    drag('stock', 100, -5000);
    fireEvent.pointerMove(window, { clientX: 400 });

    const { stock, actions } = store.getState().catalogue.columnWidths;
    expect(stock).toBe(MIN_COLUMN_PERCENT);
    expect(stock + actions).toBe(DEFAULT_COLUMN_WIDTHS.stock + DEFAULT_COLUMN_WIDTHS.actions);
  });
});
