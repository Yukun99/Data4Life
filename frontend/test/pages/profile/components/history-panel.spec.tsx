import HistoryPanel from '@/pages/profile/components/history-panel';
import { History, Loan } from '@/pages/profile/hooks/use-history';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import mockFetch from '../../../mock-fetch';

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
  returnedAt: null,
  status: 'BORROWED',
  overdueDays: 0,
  fine: 0,
  ...overrides,
});

const loans: Loan[] = [
  loan(1, { dueAt: iso(4.5) }),
  loan(2, { status: 'OVERDUE', overdueDays: 6, fine: 6 }),
  loan(3, { status: 'RETURNED', returnedAt: iso(-5) }),
  loan(4, { status: 'UNPAID', returnedAt: iso(-20), overdueDays: 6, fine: 6 }),
  loan(5, { status: 'PAID', returnedAt: iso(-40), overdueDays: 2, fine: 2 }),
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
    render(<HistoryPanel />);

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
  });

  it('pays one loan and shows the refreshed history', async () => {
    const fetchMock = mockFetch({
      'GET /api/loans': { status: 200, body: history },
      'POST /api/loans/4/pay': { status: 200, body: paid },
    });
    render(<HistoryPanel />);

    await userEvent.click(await screen.findByTestId('loan-pay-4'));

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
    render(<HistoryPanel />);

    await userEvent.click(await screen.findByTestId('history-pay-all'));

    expect(await screen.findByText('$0.00')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/loans/pay-all',
      expect.objectContaining({ method: 'POST' }),
    );
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
    render(<HistoryPanel />);

    expect(await screen.findByTestId('history-empty')).toHaveTextContent('No borrows yet');
    expect(screen.getByTestId('history-stat-genre')).toHaveTextContent('–');
    expect(screen.getByTestId('history-pay-all')).toBeDisabled();
  });

  it('shows the backend error', async () => {
    mockFetch({ 'GET /api/loans': { status: 500, body: { message: 'Server down' } } });
    render(<HistoryPanel />);

    expect(await screen.findByTestId('history-error')).toHaveTextContent('Server down');
    expect(screen.queryByTestId('history-loading')).not.toBeInTheDocument();
  });

  it('shows a spinner while loading', async () => {
    mockFetch({ 'GET /api/loans': { status: 200, body: history } });
    render(<HistoryPanel />);

    expect(screen.getByTestId('history-loading')).toBeInTheDocument();
    expect(await screen.findByTestId('history-stat-borrowed')).toBeInTheDocument();
    expect(screen.queryByTestId('history-loading')).not.toBeInTheDocument();
  });
});
