import HistoryPanel from '@/pages/profile/components/history-panel';
import { History, Loan } from '@/store/history-slice';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import mockFetch from '../../../mock-fetch';
import withStore from '../../../with-store';

const day = 86400000;
const iso = (offsetDays: number) => new Date(Date.now() + offsetDays * day).toISOString();

const loan = (id: number, overrides: Partial<Loan>): Loan => ({
  id,
  isbn: `978000000000${id}`,
  title: `Book ${id}`,
  author: 'Author',
  genre: 'Fantasy',
  borrowedAt: iso(-10),
  dueAt: iso(4),
  reservedAt: null,
  reservedUntil: null,
  returnedAt: null,
  status: 'BORROWED',
  overdueDays: 0,
  fine: 0,
  fee: 0,
  ...overrides,
});

const loans: Loan[] = [
  loan(1, { dueAt: iso(4.5) }),
  loan(2, { status: 'OVERDUE', overdueDays: 6, fine: 6 }),
  loan(3, { status: 'RETURNED', returnedAt: iso(-5) }),
  loan(4, { status: 'UNPAID', returnedAt: iso(-20), overdueDays: 6, fine: 6 }),
  loan(5, { status: 'PAID', returnedAt: iso(-40), overdueDays: 2, fine: 2 }),
  loan(6, { status: 'FORGIVEN', returnedAt: iso(-50), overdueDays: 3, fine: 3 }),
  loan(7, {
    status: 'RESERVED',
    borrowedAt: null,
    dueAt: null,
    reservedAt: '2026-03-01T00:00:00Z',
    reservedUntil: '2026-03-08T00:00:00Z',
    fee: 5,
  }),
  loan(8, {
    status: 'EXPIRED',
    borrowedAt: null,
    dueAt: null,
    reservedAt: '2026-02-01T00:00:00Z',
    reservedUntil: '2026-02-08T00:00:00Z',
    fee: 5,
  }),
  loan(9, { status: 'QUEUED', borrowedAt: null, dueAt: null, reservedAt: iso(-1), fee: 5 }),
  loan(10, { status: 'REMOVED', borrowedAt: null, dueAt: null, reservedAt: iso(-9), fee: 5 }),
  loan(11, { status: 'EXPIRED', borrowedAt: null, dueAt: null, reservedAt: iso(-8), fee: 5 }),
];

const history: History = {
  stats: {
    booksBorrowed: 5,
    favouriteGenre: 'Fantasy',
    favouriteAuthor: 'Author',
    totalOverdueFines: 6,
  },
  loans,
};

const paid: History = {
  stats: { ...history.stats, totalOverdueFines: 0 },
  loans: loans.map((item) =>
    item.status === 'UNPAID' ? { ...item, status: 'PAID' as const } : item,
  ),
};

describe('HistoryPanel', () => {
  it('shows the stats and one row per status', async () => {
    mockFetch({ 'GET /api/loans': { status: 200, body: history } });
    render(withStore(<HistoryPanel />).ui);

    expect(await screen.findByTestId('history-stat-borrowed')).toHaveTextContent('5');
    expect(screen.getByTestId('history-stat-genre')).toHaveTextContent('Fantasy');
    expect(screen.getByTestId('history-stat-author')).toHaveTextContent('Author');
    expect(screen.getByTestId('history-stat-fines')).toHaveTextContent('$6.00');
    expect(screen.getByTestId('history-pay-all')).toBeEnabled();

    expect(screen.getByTestId('loan-status-1')).toHaveTextContent('Borrowed');
    expect(screen.getByTestId('loan-detail-1')).toHaveTextContent('Due in 5 days');
    expect(screen.getByTestId('loan-status-2')).toHaveTextContent('Overdue');
    expect(screen.getByTestId('loan-detail-2')).toHaveTextContent('6 days overdue · $6.00 so far');
    expect(screen.queryByTestId('loan-pay-2')).not.toBeInTheDocument();
    expect(screen.getByTestId('loan-status-3')).toHaveTextContent('Returned');
    expect(screen.getByTestId('loan-status-4')).toHaveTextContent('Unpaid');
    expect(screen.getByTestId('loan-detail-4')).toHaveTextContent('6 days late · $6.00');
    expect(screen.getByTestId('loan-pay-4')).toBeInTheDocument();
    expect(screen.getByTestId('loan-status-5')).toHaveTextContent('Paid');
    expect(screen.getByTestId('loan-detail-5')).toHaveTextContent('$2.00 paid');
    expect(screen.getByTestId('loan-status-6')).toHaveTextContent('Forgiven');
    expect(screen.getByTestId('loan-detail-6')).toHaveTextContent('3 days late · $3.00 forgiven');
    expect(screen.queryByTestId('loan-pay-6')).not.toBeInTheDocument();
  });

  it('shows reserved and expired reservations with their fee', async () => {
    mockFetch({ 'GET /api/loans': { status: 200, body: history } });
    render(withStore(<HistoryPanel />).ui);

    const reservedDate = new Date('2026-03-01T00:00:00Z').toLocaleDateString();
    const untilDate = new Date('2026-03-08T00:00:00Z').toLocaleDateString();
    expect(await screen.findByTestId('loan-status-7')).toHaveTextContent('Reserved');
    expect(screen.getByTestId('loan-detail-7')).toHaveTextContent(
      `Reserved until ${untilDate} · $5.00 fee paid`,
    );
    expect(screen.getByTestId('loan-row-7')).toHaveTextContent(`Reserved ${reservedDate}`);
    expect(screen.getByTestId('loan-status-8')).toHaveTextContent('Expired');
    expect(screen.getByTestId('loan-detail-8')).toHaveTextContent(
      'Reservation expired · $5.00 fee paid',
    );
    expect(screen.queryByTestId('loan-pay-7')).not.toBeInTheDocument();
  });

  it('shows queued, removed and left queue rows with their fee', async () => {
    mockFetch({ 'GET /api/loans': { status: 200, body: history } });
    render(withStore(<HistoryPanel />).ui);

    expect(await screen.findByTestId('loan-status-9')).toHaveTextContent('Queued');
    expect(screen.getByTestId('loan-detail-9')).toHaveTextContent('In queue · $5.00 fee paid');
    expect(screen.getByTestId('loan-status-10')).toHaveTextContent('Removed');
    expect(screen.getByTestId('loan-detail-10')).toHaveTextContent(
      'Removed from queue · $5.00 fee paid',
    );
    expect(screen.getByTestId('loan-status-11')).toHaveTextContent('Expired');
    expect(screen.getByTestId('loan-detail-11')).toHaveTextContent('Left the queue · $5.00 fee paid');
  });

  it('pays one loan and shows the refreshed history', async () => {
    const fetchMock = mockFetch({
      'GET /api/loans': { status: 200, body: history },
      'POST /api/loans/4/pay': { status: 200, body: paid },
    });
    render(withStore(<HistoryPanel />).ui);

    await userEvent.click(await screen.findByTestId('loan-pay-4'));
    expect(screen.getByTestId('pay-dialog')).toHaveTextContent('Pay $6.00 fine for Book 4?');
    expect(fetchMock).not.toHaveBeenCalledWith('/api/loans/4/pay', expect.anything());
    await userEvent.click(screen.getByTestId('pay-confirm'));

    await waitFor(() => expect(screen.queryByTestId('pay-dialog')).not.toBeInTheDocument());
    expect(await screen.findByTestId('history-stat-fines')).toHaveTextContent('$0.00');
    expect(screen.getByTestId('loan-status-4')).toHaveTextContent('Paid');
    expect(screen.queryByTestId('loan-pay-4')).not.toBeInTheDocument();
    expect(screen.getByTestId('history-pay-all')).toBeDisabled();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/loans/4/pay',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('pays all fines', async () => {
    const fetchMock = mockFetch({
      'GET /api/loans': { status: 200, body: history },
      'POST /api/loans/pay-all': { status: 200, body: paid },
    });
    render(withStore(<HistoryPanel />).ui);

    await userEvent.click(await screen.findByTestId('history-pay-all'));
    expect(screen.getByTestId('pay-dialog')).toHaveTextContent('Pay all fines ($6.00)?');
    expect(fetchMock).not.toHaveBeenCalledWith('/api/loans/pay-all', expect.anything());
    await userEvent.click(screen.getByTestId('pay-confirm'));

    expect(await screen.findByText('$0.00')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/loans/pay-all',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('does nothing when a payment is cancelled', async () => {
    const fetchMock = mockFetch({ 'GET /api/loans': { status: 200, body: history } });
    render(withStore(<HistoryPanel />).ui);

    await userEvent.click(await screen.findByTestId('loan-pay-4'));
    await userEvent.click(screen.getByTestId('pay-cancel'));
    await waitFor(() => expect(screen.queryByTestId('pay-dialog')).not.toBeInTheDocument());
    await userEvent.click(screen.getByTestId('history-pay-all'));
    await userEvent.click(screen.getByTestId('pay-cancel'));

    await waitFor(() => expect(screen.queryByTestId('pay-dialog')).not.toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('loan-status-4')).toHaveTextContent('Unpaid');
  });

  it('shows the pay error and keeps the history', async () => {
    mockFetch({
      'GET /api/loans': { status: 200, body: history },
      'POST /api/loans/4/pay': { status: 400, body: { message: 'Nothing to pay' } },
    });
    render(withStore(<HistoryPanel />).ui);

    await userEvent.click(await screen.findByTestId('loan-pay-4'));
    await userEvent.click(screen.getByTestId('pay-confirm'));

    expect(await screen.findByTestId('pay-error')).toHaveTextContent('Nothing to pay');
    expect(screen.getByTestId('pay-dialog')).toBeInTheDocument();
    await userEvent.click(screen.getByTestId('pay-cancel'));
    await waitFor(() => expect(screen.queryByTestId('pay-dialog')).not.toBeInTheDocument());
    expect(screen.getByTestId('loan-pay-4')).toBeEnabled();
    expect(screen.getByTestId('history-stat-fines')).toHaveTextContent('$6.00');
  });

  it('shows the empty state', async () => {
    mockFetch({
      'GET /api/loans': {
        status: 200,
        body: {
          stats: {
            booksBorrowed: 0,
            favouriteGenre: null,
            favouriteAuthor: null,
            totalOverdueFines: 0,
          },
          loans: [],
        },
      },
    });
    render(withStore(<HistoryPanel />).ui);

    expect(await screen.findByTestId('history-empty')).toHaveTextContent('No borrows yet');
    expect(screen.getByTestId('history-stat-genre')).toHaveTextContent('–');
    expect(screen.getByTestId('history-pay-all')).toBeDisabled();
  });

  it('shows the backend error', async () => {
    mockFetch({ 'GET /api/loans': { status: 500, body: { message: 'Server down' } } });
    render(withStore(<HistoryPanel />).ui);

    expect(await screen.findByTestId('history-error')).toHaveTextContent('Server down');
    expect(screen.queryByTestId('history-loading')).not.toBeInTheDocument();
  });

  it('shows a spinner while loading', async () => {
    mockFetch({ 'GET /api/loans': { status: 200, body: history } });
    render(withStore(<HistoryPanel />).ui);

    expect(screen.getByTestId('history-loading')).toBeInTheDocument();
    expect(await screen.findByTestId('history-stat-borrowed')).toBeInTheDocument();
    expect(screen.queryByTestId('history-loading')).not.toBeInTheDocument();
  });
});
