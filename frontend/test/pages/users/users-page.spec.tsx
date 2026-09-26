import { Loan } from '@/common/types';
import UsersPage from '@/pages/users/users-page';
import { AdminUser } from '@/store/users-slice';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import mockFetch from '../../mock-fetch';
import { admin } from '../../users';
import withStore from '../../with-store';

const ada: AdminUser = {
  id: 1,
  name: 'Ada',
  email: 'ada@example.com',
  createdAt: '2026-01-15T00:00:00Z',
  admin: false,
  totalBorrows: 3,
  currentBorrows: 1,
  totalFines: 8,
  currentFines: 6,
  demotable: false,
  deletable: true,
};

const bob: AdminUser = {
  ...ada,
  id: 2,
  name: 'Bob',
  email: 'bob@example.com',
  admin: true,
  totalBorrows: 0,
  currentBorrows: 0,
  totalFines: 0,
  currentFines: 0,
  demotable: true,
};

const root: AdminUser = {
  ...bob,
  id: 3,
  name: 'Root',
  email: 'root@example.com',
  demotable: false,
  deletable: false,
};

const filters = {
  name: ['Ada', 'Bob', 'Root'],
  email: ['ada@example.com', 'bob@example.com', 'root@example.com'],
  admin: [false, true],
  totalBorrows: [0, 3],
  currentBorrows: [0, 1],
  totalFines: [0, 8],
  currentFines: [0, 6],
};

const loan = (id: number, overrides: Partial<Loan>): Loan => ({
  id,
  isbn: `978000000000${id}`,
  title: `Book ${id}`,
  author: 'Author',
  genre: 'Fantasy',
  borrowedAt: '2026-01-01T00:00:00Z',
  dueAt: '2026-01-15T00:00:00Z',
  reservedAt: null,
  reservedUntil: null,
  returnedAt: '2026-01-21T00:00:00Z',
  status: 'UNPAID',
  overdueDays: 6,
  fine: 6,
  fee: 0,
  ...overrides,
});

const unpaid = loan(4, {});
const paid = loan(5, { status: 'PAID', overdueDays: 2, fine: 2 });

type MockRoutes = Parameters<typeof mockFetch>[0];
type FetchMock = ReturnType<typeof mockFetch>;

const BASE = '/api/admin/users';
const FIRST = `${BASE}?page=0&size=10`;

const list = (query: string, page = 0, totalPages = 3): MockRoutes => ({
  [`GET ${BASE}?${query}`]: {
    status: 200,
    body: { users: [ada, bob, root], page, totalPages, total: totalPages * 10, filters },
  },
});

const renderPage = (routes: MockRoutes = {}) => {
  const fetchMock = mockFetch({ ...list('page=0&size=10'), ...routes });
  const { store, ui } = withStore(
    <MemoryRouter>
      <UsersPage />
    </MemoryRouter>,
    { user: admin },
  );
  render(ui);
  return { fetchMock, store };
};

const calls = (fetchMock: FetchMock, url: string) =>
  fetchMock.mock.calls.filter(([input]) => String(input) === url).length;

const called = (fetchMock: FetchMock, url: string, times = 1) =>
  waitFor(() => expect(calls(fetchMock, url)).toBeGreaterThanOrEqual(times));

describe('UsersPage', () => {
  it('renders one row per user with stacked values', async () => {
    renderPage();

    const row = await screen.findByTestId('user-row-1');
    expect(row).toHaveTextContent('Ada');
    expect(row).toHaveTextContent('ada@example.com');
    expect(row).toHaveTextContent('No');
    expect(row).toHaveTextContent('$8.00');
    expect(row).toHaveTextContent('$6.00');
    expect(screen.getByText('ada@example.com')).toHaveAttribute('title', 'ada@example.com');
    expect(screen.getByTestId('user-row-2')).toHaveTextContent('Yes');
    expect(screen.getByTestId('users-total-pages')).toHaveTextContent('/ 3');
    expect(screen.getByTestId('user-promote-1')).toBeEnabled();
    expect(screen.queryByTestId('user-demote-1')).not.toBeInTheDocument();
    expect(screen.getByTestId('user-fines-1')).toBeEnabled();
    expect(screen.getByTestId('user-fines-2')).toBeDisabled();
  });

  it('only enables demote where the backend allows it', async () => {
    renderPage();

    expect(await screen.findByTestId('user-demote-2')).toBeEnabled();
    expect(screen.getByTestId('user-demote-3')).toBeDisabled();
    expect(screen.queryByTestId('user-promote-2')).not.toBeInTheDocument();
  });

  it('promotes a user after confirming and reloads the list', async () => {
    const { fetchMock } = renderPage({
      [`POST ${BASE}/1/promote`]: { status: 200, body: { ...ada, admin: true } },
    });

    await userEvent.click(await screen.findByTestId('user-promote-1'));
    expect(screen.getByTestId('action-dialog')).toHaveTextContent('Promote Ada to admin?');
    await userEvent.click(screen.getByTestId('action-confirm'));

    await waitFor(() => expect(screen.queryByTestId('action-dialog')).not.toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE}/1/promote`,
      expect.objectContaining({ method: 'POST' }),
    );
    await called(fetchMock, FIRST, 2);
  });

  it('shows why a demotion was refused', async () => {
    renderPage({
      [`POST ${BASE}/2/demote`]: {
        status: 403,
        body: { message: 'Only the admin who promoted this user can demote them' },
      },
    });

    await userEvent.click(await screen.findByTestId('user-demote-2'));
    expect(screen.getByTestId('action-dialog')).toHaveTextContent('Remove admin from Bob?');
    await userEvent.click(screen.getByTestId('action-confirm'));

    expect(await screen.findByTestId('action-error')).toHaveTextContent(
      'Only the admin who promoted this user can demote them',
    );
    await userEvent.click(screen.getByTestId('action-cancel'));
    await waitFor(() => expect(screen.queryByTestId('action-dialog')).not.toBeInTheDocument());
  });

  it('only enables delete where the backend allows it', async () => {
    renderPage();

    expect(await screen.findByTestId('user-delete-1')).toBeEnabled();
    expect(screen.getByTestId('user-delete-2')).toBeEnabled();
    expect(screen.getByTestId('user-delete-3')).toBeDisabled();
  });

  it('deletes a user after confirming and reloads the list', async () => {
    const { fetchMock } = renderPage({ [`DELETE ${BASE}/1`]: { status: 204 } });

    await userEvent.click(await screen.findByTestId('user-delete-1'));
    expect(screen.getByTestId('action-dialog')).toHaveTextContent('Delete Ada?');
    await userEvent.click(screen.getByTestId('action-confirm'));

    await waitFor(() => expect(screen.queryByTestId('action-dialog')).not.toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledWith(`${BASE}/1`, expect.objectContaining({ method: 'DELETE' }));
    await called(fetchMock, FIRST, 2);
  });

  it('shows why a deletion was refused', async () => {
    renderPage({
      [`DELETE ${BASE}/1`]: { status: 409, body: { message: 'User still has books on loan' } },
    });

    await userEvent.click(await screen.findByTestId('user-delete-1'));
    await userEvent.click(screen.getByTestId('action-confirm'));

    expect(await screen.findByTestId('action-error')).toHaveTextContent(
      'User still has books on loan',
    );
    expect(screen.getByTestId('action-dialog')).toBeInTheDocument();
  });

  it('lists the fines and forgives an unpaid one', async () => {
    const forgiven = { ...unpaid, status: 'FORGIVEN' as const };
    const { fetchMock } = renderPage({
      [`GET ${BASE}/1/fines`]: { status: 200, body: [unpaid, paid] },
      [`POST ${BASE}/1/loans/4/forgive`]: { status: 200, body: [forgiven, paid] },
    });

    await userEvent.click(await screen.findByTestId('user-fines-1'));

    expect(await screen.findByTestId('fines-row-4')).toHaveTextContent('Book 4');
    expect(screen.getByTestId('fines-dialog')).toHaveTextContent('Fines for Ada');
    expect(screen.getByTestId('fines-status-4')).toHaveTextContent('Unpaid');
    expect(screen.getByTestId('fines-detail-4')).toHaveTextContent('6 days late · $6.00');
    expect(screen.getByTestId('fines-status-5')).toHaveTextContent('Paid');
    expect(screen.queryByTestId('fines-forgive-5')).not.toBeInTheDocument();

    await userEvent.click(screen.getByTestId('fines-forgive-4'));
    expect(screen.getByTestId('forgive-dialog')).toHaveTextContent('Forgive $6.00 fine for Book 4?');
    expect(screen.getByTestId('forgive-dialog')).toHaveTextContent(
      'Ada will no longer owe this fine.',
    );
    await userEvent.click(screen.getByTestId('forgive-cancel'));
    await waitFor(() => expect(screen.queryByTestId('forgive-dialog')).not.toBeInTheDocument());
    expect(fetchMock).not.toHaveBeenCalledWith(`${BASE}/1/loans/4/forgive`, expect.anything());

    await userEvent.click(screen.getByTestId('fines-forgive-4'));
    await userEvent.click(screen.getByTestId('forgive-confirm'));

    await waitFor(() => expect(screen.queryByTestId('forgive-dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(screen.getByTestId('fines-status-4')).toHaveTextContent('Forgiven'));
    expect(screen.queryByTestId('fines-forgive-4')).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE}/1/loans/4/forgive`,
      expect.objectContaining({ method: 'POST' }),
    );
    await called(fetchMock, FIRST, 2);

    await userEvent.click(screen.getByTestId('fines-close'));
    await waitFor(() => expect(screen.queryByTestId('fines-dialog')).not.toBeInTheDocument());
  });

  it('shows the fines error', async () => {
    renderPage({ [`GET ${BASE}/1/fines`]: { status: 404, body: { message: 'User not found' } } });

    await userEvent.click(await screen.findByTestId('user-fines-1'));

    expect(await screen.findByTestId('fines-error')).toHaveTextContent('User not found');
    expect(screen.queryByTestId('fines-empty')).not.toBeInTheDocument();
  });

  it('filters by admin and counts the active filter', async () => {
    const { fetchMock } = renderPage(list('page=0&size=10&admin=true', 0, 1));
    await screen.findByTestId('user-row-1');

    await userEvent.click(screen.getByTestId('users-filter'));
    await userEvent.click(screen.getByTestId('filter-admin'));
    await userEvent.click(await screen.findByRole('option', { name: 'Yes' }));
    await userEvent.click(screen.getByTestId('filter-apply'));

    await called(fetchMock, `${BASE}?page=0&size=10&admin=true`);
    await waitFor(() => expect(screen.getByTestId('users-filter-count')).toHaveTextContent('1'));
  });

  it('offers fine filters labelled as money', async () => {
    renderPage();
    await screen.findByTestId('user-row-1');

    await userEvent.click(screen.getByTestId('users-filter'));
    await userEvent.click(screen.getByTestId('filter-total-fines'));

    expect(await screen.findByRole('option', { name: '$8.00' })).toBeInTheDocument();
  });

  it('cycles the sort and switches keys in a stacked header', async () => {
    const { fetchMock } = renderPage({
      ...list('page=0&size=10&sort=name&dir=asc'),
      ...list('page=0&size=10&sort=email&dir=asc'),
      ...list('page=0&size=10&sort=email&dir=desc'),
    });
    await screen.findByTestId('user-row-1');

    await userEvent.click(screen.getByTestId('sort-name'));
    await called(fetchMock, `${BASE}?page=0&size=10&sort=name&dir=asc`);
    await userEvent.click(screen.getByTestId('sort-email'));
    await called(fetchMock, `${BASE}?page=0&size=10&sort=email&dir=asc`);
    expect(screen.getByTestId('sort-name')).toHaveAttribute('data-dir', 'none');
    await userEvent.click(screen.getByTestId('sort-email'));
    await called(fetchMock, `${BASE}?page=0&size=10&sort=email&dir=desc`);
    await userEvent.click(screen.getByTestId('sort-email'));
    await called(fetchMock, FIRST, 2);
    expect(screen.getByTestId('sort-email')).toHaveAttribute('data-dir', 'none');
  });

  it('moves between pages and changes the page size', async () => {
    const { fetchMock } = renderPage({
      ...list('page=1&size=10', 1),
      ...list('page=0&size=20', 0, 2),
    });
    await screen.findByTestId('user-row-1');

    await userEvent.click(screen.getByTestId('users-next'));
    await called(fetchMock, `${BASE}?page=1&size=10`);
    await waitFor(() => expect(screen.getByTestId('users-page-input')).toHaveValue('2'));

    await userEvent.selectOptions(screen.getByTestId('users-size'), '20');
    await called(fetchMock, `${BASE}?page=0&size=20`);
    await waitFor(() => expect(screen.getByTestId('users-page-input')).toHaveValue('1'));
  });

  it('shows the list error', async () => {
    renderPage({ [`GET ${FIRST}`]: { status: 500, body: { message: 'Boom' } } });

    expect(await screen.findByTestId('users-error')).toHaveTextContent('Boom');
  });
});
