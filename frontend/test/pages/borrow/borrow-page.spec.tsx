import BorrowPage from '@/pages/borrow/borrow-page';
import { BorrowBook } from '@/store/borrow-slice';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import mockFetch from '../../mock-fetch';
import { ada } from '../../users';
import withStore from '../../with-store';

const fantasy = { id: 5, name: 'Fantasy' };
const literary = { id: 8, name: 'Literary Fiction' };
const english = { id: 1, name: 'English' };
const japanese = { id: 5, name: 'Japanese' };

const dune: BorrowBook = {
  isbn: '111',
  title: 'Dune',
  author: 'Frank Herbert',
  genre: fantasy,
  language: english,
  stock: 2,
  holding: null,
};

const kokoro: BorrowBook = {
  isbn: '222',
  title: 'Kokoro',
  author: 'Natsume Soseki',
  genre: literary,
  language: japanese,
  stock: 1,
  holding: 'BORROWED',
};

const emma: BorrowBook = {
  isbn: '333',
  title: 'Emma',
  author: 'Jane Austen',
  genre: literary,
  language: english,
  stock: 0,
  holding: 'RESERVED',
};

const ulysses: BorrowBook = {
  isbn: '444',
  title: 'Ulysses',
  author: 'James Joyce',
  genre: literary,
  language: english,
  stock: 0,
  holding: null,
};

const filters = {
  isbn: ['111', '222', '333', '444'],
  title: ['Dune', 'Emma', 'Kokoro', 'Ulysses'],
  author: ['Frank Herbert', 'James Joyce', 'Jane Austen', 'Natsume Soseki'],
  genre: [fantasy, literary],
  language: [english, japanese],
  amount: [1, 2, 3],
  stock: [0, 1, 2],
};

type MockRoutes = Parameters<typeof mockFetch>[0];
type FetchMock = ReturnType<typeof mockFetch>;

const list = (
  query: string,
  block: string | null = null,
  page = 0,
  convertBlock: string | null = block,
): MockRoutes => ({
  [`GET /api/borrow?${query}`]: {
    status: 200,
    body: {
      books: [dune, kokoro, emma, ulysses],
      page,
      totalPages: 3,
      total: 30,
      filters,
      block,
      convertBlock,
    },
  },
});

const FIRST = '/api/borrow?page=0&size=10';

const renderPage = (routes: MockRoutes = {}) => {
  const fetchMock = mockFetch({ ...list('page=0&size=10'), ...routes });
  const { store, ui } = withStore(
    <MemoryRouter>
      <BorrowPage />
    </MemoryRouter>,
    { user: ada },
  );
  render(ui);
  return { fetchMock, store };
};

const calls = (fetchMock: FetchMock, url: string) =>
  fetchMock.mock.calls.filter(([input]) => String(input) === url).length;

const called = (fetchMock: FetchMock, url: string, times = 1) =>
  waitFor(() => expect(calls(fetchMock, url)).toBeGreaterThanOrEqual(times));

const pick = async (testId: string, typed: string, option: string) => {
  await userEvent.type(screen.getByTestId(testId), typed);
  await userEvent.click(await screen.findByRole('option', { name: option }));
};

describe('BorrowPage', () => {
  it('renders the rows with their holdings and buttons', async () => {
    renderPage();

    expect(await screen.findByTestId('borrow-row-111')).toHaveTextContent('Dune');
    expect(screen.getByTestId('borrow-row-111')).toHaveTextContent('Frank Herbert');
    expect(screen.getByTestId('borrow-row-222')).toHaveTextContent('Japanese');
    expect(screen.getByTestId('borrow-borrow-111')).toBeEnabled();
    expect(screen.getByTestId('borrow-reserve-111')).toBeEnabled();
    expect(screen.queryByTestId('borrow-holding-111')).not.toBeInTheDocument();
    expect(screen.queryByTestId('borrow-block')).not.toBeInTheDocument();

    expect(screen.getByTestId('borrow-holding-222')).toHaveTextContent('Borrowed');
    expect(screen.queryByTestId('borrow-borrow-222')).not.toBeInTheDocument();
    expect(screen.queryByTestId('borrow-reserve-222')).not.toBeInTheDocument();

    expect(screen.getByTestId('borrow-holding-333')).toHaveTextContent('Reserved');
    expect(screen.getByTestId('borrow-borrow-333')).toBeEnabled();
    expect(screen.queryByTestId('borrow-reserve-333')).not.toBeInTheDocument();
  });

  it('disables both buttons when a book is out of stock', async () => {
    renderPage();

    expect(await screen.findByTestId('borrow-borrow-444')).toBeDisabled();
    expect(screen.getByTestId('borrow-reserve-444')).toBeDisabled();

    await userEvent.hover(screen.getByTestId('borrow-borrow-444').parentElement as HTMLElement);
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Out of stock');
  });

  it('shows the block reason and disables every button', async () => {
    renderPage(list('page=0&size=10', 'You have unpaid fines'));

    expect(await screen.findByTestId('borrow-block')).toHaveTextContent('You have unpaid fines');
    expect(screen.getByTestId('borrow-borrow-111')).toBeDisabled();
    expect(screen.getByTestId('borrow-reserve-111')).toBeDisabled();
    expect(screen.getByTestId('borrow-borrow-333')).toBeDisabled();
  });

  it('keeps Borrow enabled on a reserved row when only the 8 book cap blocks', async () => {
    renderPage(list('page=0&size=10', 'You already hold 8 books', 0, null));

    expect(await screen.findByTestId('borrow-block')).toHaveTextContent('You already hold 8 books');
    expect(screen.getByTestId('borrow-borrow-111')).toBeDisabled();
    expect(screen.getByTestId('borrow-reserve-111')).toBeDisabled();
    expect(screen.getByTestId('borrow-borrow-333')).toBeEnabled();
  });

  it('borrows a book after confirming and reloads the list', async () => {
    const { fetchMock } = renderPage({
      'POST /api/borrow/111': { status: 200, body: { ...dune, stock: 1, holding: 'BORROWED' } },
    });

    await userEvent.click(await screen.findByTestId('borrow-borrow-111'));
    const dialog = screen.getByTestId('borrow-confirm-dialog');
    expect(dialog).toHaveTextContent('Borrow Dune?');
    expect(dialog).toHaveTextContent('Due back in 14 days.');
    expect(calls(fetchMock, '/api/borrow/111')).toBe(0);

    await userEvent.click(screen.getByTestId('borrow-confirm-confirm'));

    await waitFor(() =>
      expect(screen.queryByTestId('borrow-confirm-dialog')).not.toBeInTheDocument(),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/borrow/111',
      expect.objectContaining({ method: 'POST' }),
    );
    await called(fetchMock, FIRST, 2);
  });

  it('turns a reservation into a loan', async () => {
    const { fetchMock } = renderPage({
      'POST /api/borrow/333': { status: 200, body: { ...emma, holding: 'BORROWED' } },
    });

    await userEvent.click(await screen.findByTestId('borrow-borrow-333'));
    expect(screen.getByTestId('borrow-confirm-dialog')).toHaveTextContent(
      'This turns your reservation into a loan due in 14 days.',
    );
    await userEvent.click(screen.getByTestId('borrow-confirm-confirm'));

    await called(fetchMock, '/api/borrow/333');
    await called(fetchMock, FIRST, 2);
  });

  it('reserves a book after confirming the fee', async () => {
    const { fetchMock } = renderPage({
      'POST /api/borrow/111/reserve': {
        status: 200,
        body: { ...dune, stock: 1, holding: 'RESERVED' },
      },
    });

    await userEvent.click(await screen.findByTestId('borrow-reserve-111'));
    const dialog = screen.getByTestId('borrow-confirm-dialog');
    expect(dialog).toHaveTextContent('Reserve Dune?');
    expect(dialog).toHaveTextContent('Pay $5.00 to hold a copy for 7 days.');
    expect(screen.getByTestId('borrow-confirm-confirm')).toHaveTextContent('Pay and reserve');

    await userEvent.click(screen.getByTestId('borrow-confirm-confirm'));

    await waitFor(() =>
      expect(screen.queryByTestId('borrow-confirm-dialog')).not.toBeInTheDocument(),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/borrow/111/reserve',
      expect.objectContaining({ method: 'POST' }),
    );
    await called(fetchMock, FIRST, 2);
  });

  it('keeps the dialog open with the backend message on a conflict', async () => {
    const { fetchMock } = renderPage({
      'POST /api/borrow/111': { status: 409, body: { message: 'Out of stock' } },
    });

    await userEvent.click(await screen.findByTestId('borrow-borrow-111'));
    await userEvent.click(screen.getByTestId('borrow-confirm-confirm'));

    expect(await screen.findByTestId('borrow-confirm-error')).toHaveTextContent('Out of stock');
    expect(screen.getByTestId('borrow-confirm-dialog')).toBeInTheDocument();
    expect(calls(fetchMock, FIRST)).toBe(1);

    await userEvent.click(screen.getByTestId('borrow-confirm-cancel'));
    await waitFor(() =>
      expect(screen.queryByTestId('borrow-confirm-dialog')).not.toBeInTheDocument(),
    );
  });

  it('applies a genre filter', async () => {
    const { fetchMock } = renderPage(list('page=0&size=10&genreId=5'));
    await screen.findByTestId('borrow-row-111');

    await userEvent.click(screen.getByTestId('borrow-filter'));
    expect(screen.queryByTestId('filter-amount')).not.toBeInTheDocument();
    await pick('filter-genre', 'Fan', 'Fantasy');
    await userEvent.click(screen.getByTestId('filter-apply'));

    await called(fetchMock, '/api/borrow?page=0&size=10&genreId=5');
    await waitFor(() => expect(screen.getByTestId('borrow-filter-count')).toHaveTextContent('1'));
  });

  it('sorts, changes the page size and moves between pages', async () => {
    const { fetchMock } = renderPage({
      ...list('page=0&size=10&sort=title&dir=asc'),
      ...list('page=0&size=20&sort=title&dir=asc'),
      ...list('page=1&size=20&sort=title&dir=asc', null, 1),
    });
    await screen.findByTestId('borrow-row-111');

    await userEvent.click(screen.getByTestId('sort-title'));
    await called(fetchMock, '/api/borrow?page=0&size=10&sort=title&dir=asc');
    await userEvent.selectOptions(screen.getByTestId('borrow-size'), '20');
    await called(fetchMock, '/api/borrow?page=0&size=20&sort=title&dir=asc');
    await userEvent.click(screen.getByTestId('borrow-next'));
    await called(fetchMock, '/api/borrow?page=1&size=20&sort=title&dir=asc');
    await waitFor(() => expect(screen.getByTestId('borrow-page-input')).toHaveValue('2'));
  });

  it('shows the list error', async () => {
    renderPage({ 'GET /api/borrow?page=0&size=10': { status: 500, body: { message: 'Boom' } } });

    expect(await screen.findByTestId('borrow-error')).toHaveTextContent('Boom');
  });
});
