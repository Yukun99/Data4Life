import NotificationBell from '@/features/notifications/notification-bell';
import { Notification } from '@/store/notification-slice';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import MockEventSource from '../../mock-event-source';
import mockFetch from '../../mock-fetch';
import { ada } from '../../users';
import withStore from '../../with-store';

type MockRoutes = Parameters<typeof mockFetch>[0];

const note = (id: number, overrides: Partial<Notification> = {}): Notification => ({
  id,
  type: 'AVAILABLE',
  isbn: '111',
  title: 'Dune',
  createdAt: '2026-09-27T00:00:00Z',
  read: false,
  ...overrides,
});

const ready = note(3);
const unpaid = note(2, { type: 'REMOVED_UNPAID', isbn: '222', title: 'Kokoro' });
const overdue = note(1, { type: 'REMOVED_OVERDUE', isbn: '333', title: 'Emma', read: true });

const READY_TEXT = 'Dune is ready. Borrow it within 7 days.';
const UNPAID_TEXT = 'You were removed from the queue for Kokoro because you have unpaid fines.';
const OVERDUE_TEXT = 'You were removed from the queue for Emma because you have an overdue book.';

const page = (items: Notification[], hasMore = false, unread = 2): MockRoutes => ({
  'GET /api/notifications': { status: 200, body: { items, hasMore } },
  'GET /api/notifications/unread': { status: 200, body: { count: unread } },
});

const renderBell = (routes: MockRoutes = {}) => {
  const fetchMock = mockFetch({ ...page([ready, unpaid, overdue]), ...routes });
  const { store, ui } = withStore(
    <MemoryRouter initialEntries={['/']}>
      <NotificationBell />
      <Routes>
        <Route path="/" element={<p>home route</p>} />
        <Route path="/borrow" element={<p>borrow route</p>} />
        <Route path="/profile" element={<p>profile route</p>} />
      </Routes>
    </MemoryRouter>,
    { user: ada },
  );
  render(ui);
  return { fetchMock, store };
};

const connect = () => act(() => MockEventSource.latest().emit('open'));

const openPanel = async () => {
  await userEvent.click(screen.getByTestId('header-notifications'));
  return screen.findByTestId('notifications-panel');
};

const badge = () => screen.getByTestId('header-notifications-count');

describe('NotificationBell', () => {
  it('opens the stream and hides the badge until something is unread', async () => {
    renderBell();

    expect(MockEventSource.latest().url).toBe('/api/notifications/stream');
    expect(badge()).toHaveClass('MuiBadge-invisible');

    connect();

    await waitFor(() => expect(badge()).toHaveTextContent('2'));
    expect(badge()).not.toHaveClass('MuiBadge-invisible');
  });

  it('closes the stream on unmount', () => {
    mockFetch({});
    const { ui } = withStore(
      <MemoryRouter>
        <NotificationBell />
      </MemoryRouter>,
    );
    const { unmount } = render(ui);

    unmount();

    expect(MockEventSource.latest().closed).toBe(true);
  });

  it('lists the notifications with unread ones in bold', async () => {
    renderBell();
    connect();

    await openPanel();

    expect(await screen.findByText(READY_TEXT)).toBeInTheDocument();
    expect(screen.getByText(UNPAID_TEXT)).toBeInTheDocument();
    expect(screen.getByText(OVERDUE_TEXT)).toBeInTheDocument();
    expect(screen.getByText(READY_TEXT)).toHaveStyle({ fontWeight: '700' });
    expect(screen.getByText(OVERDUE_TEXT)).toHaveStyle({ fontWeight: '400' });
    expect(screen.getByTestId('notification-read-3')).toBeInTheDocument();
    expect(screen.queryByTestId('notification-read-1')).not.toBeInTheDocument();
  });

  it('marks one notification as read', async () => {
    const { fetchMock } = renderBell({
      'POST /api/notifications/3/read': { status: 200, body: { count: 1 } },
    });
    connect();
    await openPanel();

    await userEvent.click(await screen.findByTestId('notification-read-3'));

    await waitFor(() => expect(screen.queryByTestId('notification-read-3')).not.toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/notifications/3/read',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(badge()).toHaveTextContent('1');
    expect(screen.getByText(READY_TEXT)).toHaveStyle({ fontWeight: '400' });
  });

  it('deletes one notification without asking', async () => {
    const { fetchMock } = renderBell({
      'DELETE /api/notifications/2': { status: 200, body: { count: 1 } },
    });
    connect();
    await openPanel();

    await userEvent.click(await screen.findByTestId('notification-delete-2'));

    await waitFor(() => expect(screen.queryByTestId('notification-2')).not.toBeInTheDocument());
    expect(screen.queryByTestId('notifications-confirm-dialog')).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/notifications/2',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('marks all notifications as read', async () => {
    const { fetchMock } = renderBell({
      'POST /api/notifications/read-all': { status: 200, body: { count: 0 } },
    });
    connect();
    await openPanel();

    await userEvent.click(await screen.findByTestId('notifications-read-all'));

    await waitFor(() => expect(badge()).toHaveClass('MuiBadge-invisible'));
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/notifications/read-all',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(screen.queryByTestId('notification-read-3')).not.toBeInTheDocument();
    expect(screen.getByTestId('notifications-read-all')).toBeDisabled();
  });

  it('deletes all notifications only after confirming', async () => {
    const { fetchMock } = renderBell({
      'DELETE /api/notifications': { status: 200, body: { count: 0 } },
    });
    connect();
    await openPanel();
    await screen.findByTestId('notification-3');

    await userEvent.click(screen.getByTestId('notifications-delete-all'));
    expect(await screen.findByTestId('notifications-confirm-dialog')).toHaveTextContent(
      'Delete all notifications?',
    );
    await userEvent.click(screen.getByTestId('notifications-confirm-cancel'));
    await waitFor(() =>
      expect(screen.queryByTestId('notifications-confirm-dialog')).not.toBeInTheDocument(),
    );
    expect(fetchMock).not.toHaveBeenCalledWith('/api/notifications', expect.objectContaining({ method: 'DELETE' }));

    await userEvent.click(screen.getByTestId('notifications-delete-all'));
    await userEvent.click(await screen.findByTestId('notifications-confirm-confirm'));

    expect(await screen.findByTestId('notifications-empty')).toHaveTextContent('No notifications');
    await waitFor(() =>
      expect(screen.queryByTestId('notifications-confirm-dialog')).not.toBeInTheDocument(),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/notifications',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('keeps the confirm dialog open with the error when delete all fails', async () => {
    renderBell({ 'DELETE /api/notifications': { status: 500, body: { message: 'Boom' } } });
    connect();
    await openPanel();
    await screen.findByTestId('notification-3');

    await userEvent.click(screen.getByTestId('notifications-delete-all'));
    await userEvent.click(await screen.findByTestId('notifications-confirm-confirm'));

    expect(await screen.findByTestId('notifications-confirm-error')).toHaveTextContent('Boom');
    expect(screen.getByTestId('notifications-confirm-dialog')).toBeInTheDocument();
  });

  it('opens the borrow page filtered to the book when a ready notification is clicked', async () => {
    const { fetchMock, store } = renderBell({
      'POST /api/notifications/3/read': { status: 200, body: { count: 1 } },
    });
    connect();
    await openPanel();

    await userEvent.click(await screen.findByText(READY_TEXT));

    expect(await screen.findByText('borrow route')).toBeInTheDocument();
    expect(store.getState().borrow).toMatchObject({ filter: { isbn: '111' }, flashIsbn: '111' });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/notifications/3/read',
      expect.objectContaining({ method: 'POST' }),
    );
    await waitFor(() => expect(screen.queryByTestId('notifications-panel')).not.toBeInTheDocument());
  });

  it('opens the profile when a removal notification is clicked', async () => {
    renderBell({ 'POST /api/notifications/2/read': { status: 200, body: { count: 1 } } });
    connect();
    await openPanel();

    await userEvent.click(await screen.findByText(UNPAID_TEXT));

    expect(await screen.findByText('profile route')).toBeInTheDocument();
  });

  it('does not mark an already read notification again', async () => {
    const { fetchMock } = renderBell();
    connect();
    await openPanel();

    await userEvent.click(await screen.findByText(OVERDUE_TEXT));

    expect(await screen.findByText('profile route')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalledWith('/api/notifications/1/read', expect.anything());
  });

  it('loads the next page when scrolled to the bottom', async () => {
    const older = note(0, { title: 'Ulysses', read: true });
    const { fetchMock } = renderBell({
      ...page([ready, unpaid, overdue], true),
      'GET /api/notifications?before=1': { status: 200, body: { items: [older], hasMore: false } },
    });
    connect();
    const panel = await openPanel();
    await screen.findByTestId('notification-1');

    fireEvent.scroll(within(panel).getByTestId('notifications-list'));

    expect(await screen.findByTestId('notification-0')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/notifications?before=1', expect.anything());

    fireEvent.scroll(screen.getByTestId('notifications-list'));
    expect(fetchMock.mock.calls.filter(([input]) => String(input).includes('before'))).toHaveLength(1);
  });

  it('shows the loading bar while fetching', async () => {
    renderBell();
    await openPanel();

    connect();

    expect(screen.getByTestId('notifications-loading')).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByTestId('notifications-loading')).not.toBeInTheDocument(),
    );
  });

  it('adds a live notification to the top and raises the badge', async () => {
    renderBell();
    connect();
    await waitFor(() => expect(badge()).toHaveTextContent('2'));
    await openPanel();
    await screen.findByTestId('notification-3');

    act(() => MockEventSource.latest().emit('notification', note(4, { title: 'Hamlet' })));

    expect(await screen.findByText('Hamlet is ready. Borrow it within 7 days.')).toBeInTheDocument();
    expect(badge()).toHaveTextContent('3');
    const ids = within(screen.getByTestId('notifications-list'))
      .getAllByTestId(/^notification-\d+$/)
      .map((item) => item.dataset.testid);
    expect(ids).toEqual(['notification-4', 'notification-3', 'notification-2', 'notification-1']);
  });

  it('shows the empty state', async () => {
    renderBell(page([], false, 0));
    connect();
    await openPanel();

    expect(await screen.findByTestId('notifications-empty')).toBeInTheDocument();
    expect(screen.getByTestId('notifications-delete-all')).toBeDisabled();
  });

  it('shows the error when the list fails', async () => {
    renderBell({ 'GET /api/notifications': { status: 500, body: { message: 'Boom' } } });
    connect();
    await openPanel();

    expect(await screen.findByTestId('notifications-error')).toHaveTextContent('Boom');
  });
});
