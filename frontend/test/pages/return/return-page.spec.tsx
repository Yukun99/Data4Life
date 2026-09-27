import ReturnPage from '@/pages/return/return-page';
import { received } from '@/store/notification-slice';
import { ReturnLoan } from '@/store/return-slice';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import mockFetch from '../../mock-fetch';
import { ada } from '../../users';
import withStore from '../../with-store';

const DAY = 86400000;
const HOUR = 3600000;

const fantasy = { id: 5, name: 'Fantasy' };
const literary = { id: 8, name: 'Literary Fiction' };
const english = { id: 1, name: 'English' };
const japanese = { id: 5, name: 'Japanese' };

const iso = (offset: number) => new Date(Date.now() + offset).toISOString();

const dune: ReturnLoan = {
  id: 1,
  isbn: '111',
  title: 'Dune',
  author: 'Frank Herbert',
  genre: fantasy,
  language: english,
  status: 'BORROWED',
  dueAt: iso(5 * DAY - HOUR),
  returnedAt: null,
  reservedUntil: null,
  overdueDays: 0,
  fine: 0,
  queuePosition: null,
};

const kokoro: ReturnLoan = {
  id: 2,
  isbn: '222',
  title: 'Kokoro',
  author: 'Natsume Soseki',
  genre: literary,
  language: japanese,
  status: 'OVERDUE',
  dueAt: iso(-3 * DAY + HOUR),
  returnedAt: null,
  reservedUntil: null,
  overdueDays: 3,
  fine: 3,
  queuePosition: null,
};

const emma: ReturnLoan = {
  id: 3,
  isbn: '333',
  title: 'Emma',
  author: 'Jane Austen',
  genre: literary,
  language: english,
  status: 'UNPAID',
  dueAt: iso(-26 * DAY),
  returnedAt: iso(-20 * DAY),
  reservedUntil: null,
  overdueDays: 6,
  fine: 6,
  queuePosition: null,
};

const brown: ReturnLoan = {
  id: 4,
  isbn: '444',
  title: 'The Da Vinci Code',
  author: 'Dan Brown',
  genre: fantasy,
  language: english,
  status: 'RESERVED',
  dueAt: null,
  returnedAt: null,
  reservedUntil: iso(7 * DAY),
  overdueDays: 0,
  fine: 0,
  queuePosition: null,
};

const hamlet: ReturnLoan = {
  id: 5,
  isbn: '555',
  title: 'Hamlet',
  author: 'William Shakespeare',
  genre: literary,
  language: english,
  status: 'QUEUED',
  dueAt: null,
  returnedAt: null,
  reservedUntil: null,
  overdueDays: 0,
  fine: 0,
  queuePosition: 1,
};

const filters = {
  isbn: ['111', '222', '333', '444'],
  title: ['Dune', 'Emma', 'Kokoro', 'The Da Vinci Code'],
  author: ['Dan Brown', 'Frank Herbert', 'Jane Austen', 'Natsume Soseki'],
  genre: [fantasy, literary],
  language: [english, japanese],
};

type MockRoutes = Parameters<typeof mockFetch>[0];
type FetchMock = ReturnType<typeof mockFetch>;

const list = (query: string, totalUnpaid = 6, page = 0): MockRoutes => ({
  [`GET /api/return?${query}`]: {
    status: 200,
    body: {
      loans: [emma, kokoro, brown, dune, hamlet],
      page,
      totalPages: 3,
      total: 30,
      filters,
      totalUnpaid,
    },
  },
});

const FIRST = '/api/return?page=0&size=10';

const renderPage = (routes: MockRoutes = {}) => {
  const fetchMock = mockFetch({ ...list('page=0&size=10'), ...routes });
  const { store, ui } = withStore(
    <MemoryRouter>
      <ReturnPage />
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

const dialogClosed = () =>
  waitFor(() =>
    expect(screen.queryByTestId('return-confirm-dialog')).not.toBeInTheDocument(),
  );

describe('ReturnPage', () => {
  it('renders the rows with their status and buttons', async () => {
    renderPage();

    expect(await screen.findByTestId('return-row-1')).toHaveTextContent('Dune');
    expect(screen.getByTestId('return-row-1')).toHaveTextContent('Frank Herbert');
    expect(screen.getByTestId('return-row-2')).toHaveTextContent('Japanese');

    expect(screen.getByTestId('return-status-1')).toHaveTextContent('Borrowed');
    expect(screen.getByTestId('return-row-1')).toHaveTextContent(
      `Due ${new Date(dune.dueAt ?? '').toLocaleDateString()}`,
    );
    expect(screen.getByTestId('return-return-1')).toHaveTextContent('Return');

    expect(screen.getByTestId('return-status-2')).toHaveTextContent('Overdue');
    expect(screen.getByTestId('return-row-2')).toHaveTextContent('3 days overdue · $3.00 so far');
    expect(screen.getByTestId('return-return-2')).toBeEnabled();

    expect(screen.getByTestId('return-status-3')).toHaveTextContent('Unpaid');
    expect(screen.getByTestId('return-row-3')).toHaveTextContent('6 days late · $6.00');
    expect(screen.getByTestId('return-pay-3')).toHaveTextContent('Pay fine');
    expect(screen.queryByTestId('return-return-3')).not.toBeInTheDocument();

    expect(screen.getByTestId('return-status-4')).toHaveTextContent('Reserved');
    expect(screen.getByTestId('return-row-4')).toHaveTextContent(
      `Reserved until ${new Date(brown.reservedUntil ?? '').toLocaleDateString()}`,
    );
    expect(screen.getByTestId('return-unreserve-4')).toHaveTextContent('Unreserve');
    expect(screen.queryByTestId('return-return-4')).not.toBeInTheDocument();

    expect(screen.getByTestId('return-pay-all')).toBeEnabled();
  });

  it('shows a queued row with its position and a Leave queue button', async () => {
    renderPage();

    expect(await screen.findByTestId('return-status-5')).toHaveTextContent('Queued');
    expect(screen.getByTestId('return-row-5')).toHaveTextContent('Number 1 in queue');
    expect(screen.getByTestId('return-unreserve-5')).toHaveTextContent('Leave queue');
    expect(screen.queryByTestId('return-return-5')).not.toBeInTheDocument();
  });

  it('leaves the queue after confirming and reloads the list', async () => {
    const { fetchMock } = renderPage({
      'POST /api/return/5/unreserve': { status: 200, body: { ...hamlet, status: 'EXPIRED' } },
    });

    await userEvent.click(await screen.findByTestId('return-unreserve-5'));
    const dialog = screen.getByTestId('return-confirm-dialog');
    expect(dialog).toHaveTextContent('Leave the queue for Hamlet?');
    expect(dialog).toHaveTextContent('The $5.00 fee is not refunded.');
    expect(screen.getByTestId('return-confirm-confirm')).toHaveTextContent('Leave queue');

    await userEvent.click(screen.getByTestId('return-confirm-confirm'));

    await dialogClosed();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/return/5/unreserve',
      expect.objectContaining({ method: 'POST' }),
    );
    await called(fetchMock, FIRST, 2);
  });

  it('reloads the list when a live notification arrives', async () => {
    const { fetchMock, store } = renderPage();
    await screen.findByTestId('return-row-1');
    expect(calls(fetchMock, FIRST)).toBe(1);

    act(() => {
      store.dispatch(
        received({
          id: 9,
          type: 'AVAILABLE',
          isbn: '555',
          title: 'Hamlet',
          createdAt: '2026-09-27T00:00:00Z',
          read: false,
        }),
      );
    });

    await called(fetchMock, FIRST, 2);
  });

  it('cancels a reservation after confirming and reloads the list', async () => {
    const { fetchMock } = renderPage({
      'POST /api/return/4/unreserve': { status: 200, body: { ...brown, status: 'EXPIRED' } },
    });

    await userEvent.click(await screen.findByTestId('return-unreserve-4'));
    const dialog = screen.getByTestId('return-confirm-dialog');
    expect(dialog).toHaveTextContent('Cancel reservation for The Da Vinci Code?');
    expect(dialog).toHaveTextContent('The $5.00 fee is not refunded.');
    expect(screen.getByTestId('return-confirm-confirm')).toHaveTextContent('Unreserve');

    await userEvent.click(screen.getByTestId('return-confirm-confirm'));

    await dialogClosed();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/return/4/unreserve',
      expect.objectContaining({ method: 'POST' }),
    );
    await called(fetchMock, FIRST, 2);
  });

  it('returns a book after confirming and reloads the list', async () => {
    const { fetchMock } = renderPage({
      'POST /api/return/1': { status: 200, body: { ...dune, returnedAt: iso(0) } },
    });

    await userEvent.click(await screen.findByTestId('return-return-1'));
    const dialog = screen.getByTestId('return-confirm-dialog');
    expect(dialog).toHaveTextContent('Return Dune?');
    expect(dialog).toHaveTextContent('Due in 5 days.');
    expect(screen.getByTestId('return-confirm-confirm')).toHaveTextContent('Return');
    expect(calls(fetchMock, '/api/return/1')).toBe(0);

    await userEvent.click(screen.getByTestId('return-confirm-confirm'));

    await dialogClosed();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/return/1',
      expect.objectContaining({ method: 'POST' }),
    );
    await called(fetchMock, FIRST, 2);
  });

  it('warns about the fine when returning an overdue book', async () => {
    const { fetchMock } = renderPage({
      'POST /api/return/2': { status: 200, body: { ...kokoro, status: 'UNPAID' } },
    });

    await userEvent.click(await screen.findByTestId('return-return-2'));
    const dialog = screen.getByTestId('return-confirm-dialog');
    expect(dialog).toHaveTextContent('Return Kokoro?');
    expect(dialog).toHaveTextContent(
      '3 days overdue. A $3.00 fine becomes payable after return.',
    );

    await userEvent.click(screen.getByTestId('return-confirm-confirm'));

    await called(fetchMock, '/api/return/2');
    await called(fetchMock, FIRST, 2);
  });

  it('pays one fine after confirming', async () => {
    const { fetchMock } = renderPage({ 'POST /api/loans/3/pay': { status: 200, body: {} } });

    await userEvent.click(await screen.findByTestId('return-pay-3'));
    const dialog = screen.getByTestId('return-confirm-dialog');
    expect(dialog).toHaveTextContent('Pay $6.00 fine for Emma?');
    expect(dialog).toHaveTextContent('This records the payment on your account.');
    expect(screen.getByTestId('return-confirm-confirm')).toHaveTextContent('Pay');

    await userEvent.click(screen.getByTestId('return-confirm-confirm'));

    await dialogClosed();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/loans/3/pay',
      expect.objectContaining({ method: 'POST' }),
    );
    await called(fetchMock, FIRST, 2);
  });

  it('pays all fines after confirming', async () => {
    const { fetchMock } = renderPage({ 'POST /api/loans/pay-all': { status: 200, body: {} } });

    await screen.findByTestId('return-row-1');
    await userEvent.click(screen.getByTestId('return-pay-all'));
    const dialog = screen.getByTestId('return-confirm-dialog');
    expect(dialog).toHaveTextContent('Pay all fines ($6.00)?');
    expect(dialog).toHaveTextContent('This records the payment on your account.');

    await userEvent.click(screen.getByTestId('return-confirm-confirm'));

    await dialogClosed();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/loans/pay-all',
      expect.objectContaining({ method: 'POST' }),
    );
    await called(fetchMock, FIRST, 2);
  });

  it('disables Pay all when nothing is owed', async () => {
    renderPage(list('page=0&size=10', 0));

    await screen.findByTestId('return-row-1');
    expect(screen.getByTestId('return-pay-all')).toBeDisabled();
  });

  it('keeps the dialog open with the backend message on a conflict', async () => {
    const { fetchMock } = renderPage({
      'POST /api/return/1': { status: 409, body: { message: 'This book was already returned' } },
    });

    await userEvent.click(await screen.findByTestId('return-return-1'));
    await userEvent.click(screen.getByTestId('return-confirm-confirm'));

    expect(await screen.findByTestId('return-confirm-error')).toHaveTextContent(
      'This book was already returned',
    );
    expect(screen.getByTestId('return-confirm-dialog')).toBeInTheDocument();
    expect(calls(fetchMock, FIRST)).toBe(1);

    await userEvent.click(screen.getByTestId('return-confirm-cancel'));
    await dialogClosed();
  });

  it('applies a genre filter', async () => {
    const { fetchMock } = renderPage(list('page=0&size=10&genreId=5'));
    await screen.findByTestId('return-row-1');

    await userEvent.click(screen.getByTestId('return-filter'));
    expect(screen.queryByTestId('filter-stock')).not.toBeInTheDocument();
    await pick('filter-genre', 'Fan', 'Fantasy');
    await userEvent.click(screen.getByTestId('filter-apply'));

    await called(fetchMock, '/api/return?page=0&size=10&genreId=5');
    await waitFor(() => expect(screen.getByTestId('return-filter-count')).toHaveTextContent('1'));
  });

  it('sorts, changes the page size and moves between pages', async () => {
    const { fetchMock } = renderPage({
      ...list('page=0&size=10&sort=due&dir=asc'),
      ...list('page=0&size=20&sort=due&dir=asc'),
      ...list('page=1&size=20&sort=due&dir=asc', 6, 1),
    });
    await screen.findByTestId('return-row-1');

    await userEvent.click(screen.getByTestId('sort-due'));
    await called(fetchMock, '/api/return?page=0&size=10&sort=due&dir=asc');
    await userEvent.selectOptions(screen.getByTestId('return-size'), '20');
    await called(fetchMock, '/api/return?page=0&size=20&sort=due&dir=asc');
    await userEvent.click(screen.getByTestId('return-next'));
    await called(fetchMock, '/api/return?page=1&size=20&sort=due&dir=asc');
    await waitFor(() => expect(screen.getByTestId('return-page-input')).toHaveValue('2'));
  });

  it('shows the list error', async () => {
    renderPage({ 'GET /api/return?page=0&size=10': { status: 500, body: { message: 'Boom' } } });

    expect(await screen.findByTestId('return-error')).toHaveTextContent('Boom');
  });
});
