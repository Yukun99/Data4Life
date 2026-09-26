import ProfilePage from '@/pages/profile/profile-page';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import mockFetch from '../../mock-fetch';
import { ada } from '../../users';
import withStore from '../../with-store';

const genres = [
  'Art',
  'Biography',
  'Business',
  'Cooking',
  'Fantasy',
  'History',
  'Horror',
  'Mystery',
  'Poetry',
  'Romance',
  'Science',
  'Travel',
].map((name, index) => ({ id: index + 1, name }));
const languages = [
  { id: 1, name: 'English' },
  { id: 2, name: 'French' },
];

const emptyHistory = {
  stats: { booksBorrowed: 0, favouriteGenre: null, favouriteAuthor: null, totalOverdueFines: 0 },
  loans: [],
};

const prompted = { genres: [], languages: [], prompted: true };

type MockRoutes = Parameters<typeof mockFetch>[0];

const pageRoutes = (interests: object, extra: MockRoutes = {}): MockRoutes => ({
  'GET /api/interests/options': { status: 200, body: { genres, languages } },
  'GET /api/interests': { status: 200, body: interests },
  'GET /api/loans': { status: 200, body: emptyHistory },
  ...extra,
});

const renderPage = () => {
  const { store, ui } = withStore(
    <MemoryRouter initialEntries={['/profile']}>
      <Routes>
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/login" element={<p>login route</p>} />
      </Routes>
    </MemoryRouter>,
    { user: ada },
  );
  render(ui);
  return store;
};

describe('ProfilePage', () => {
  it('shows the user and logs out', async () => {
    const fetchMock = mockFetch(pageRoutes(prompted, { 'POST /api/auth/logout': { status: 204 } }));
    const store = renderPage();

    expect(screen.getByTestId('profile-name')).toHaveTextContent('Ada');
    expect(screen.getByTestId('profile-email')).toHaveTextContent('ada@example.com');
    expect(screen.getByTestId('profile-created')).toHaveTextContent('2026');
    expect(screen.getByTestId('profile-avatar')).toHaveAttribute('data-avatar', 'ACCOUNT');
    expect(await screen.findByTestId('history-empty')).toBeInTheDocument();

    await userEvent.click(screen.getByTestId('profile-logout'));

    expect(await screen.findByText('login route')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/logout', expect.anything());
    expect(store.getState().user.user).toBeNull();
  });

  it('asks for interests the first time and skips', async () => {
    const fetchMock = mockFetch(
      pageRoutes(
        { genres: [], languages: [], prompted: false },
        { 'POST /api/interests/skip': { status: 204 } },
      ),
    );
    renderPage();

    await userEvent.click(await screen.findByTestId('interests-skip'));

    expect(await screen.findByTestId('interests-empty')).toHaveTextContent('No interests yet');
    await waitFor(() => expect(screen.queryByTestId('interests-dialog')).not.toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/interests/skip',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('does not ask again once prompted', async () => {
    mockFetch(pageRoutes(prompted));
    renderPage();

    expect(await screen.findByTestId('interests-empty')).toBeInTheDocument();
    expect(screen.queryByTestId('interests-dialog')).not.toBeInTheDocument();
  });

  it('picks a genre by typing and saves it', async () => {
    const saved = { genres: [{ id: 5, name: 'Fantasy' }], languages: [], prompted: true };
    const fetchMock = mockFetch(
      pageRoutes(prompted, { 'PUT /api/interests': { status: 200, body: saved } }),
    );
    renderPage();
    await screen.findByTestId('interests-empty');

    await userEvent.click(screen.getByTestId('interests-edit'));
    expect(screen.queryByTestId('interests-skip')).not.toBeInTheDocument();
    await userEvent.type(screen.getByTestId('interests-genres'), 'fan');
    await userEvent.click(await screen.findByRole('option', { name: 'Fantasy' }));

    expect(screen.getByTestId('interests-selected-Fantasy')).toBeInTheDocument();
    expect(screen.getByTestId('interests-count')).toHaveTextContent('1 / 10');

    await userEvent.click(screen.getByTestId('interests-confirm'));

    expect(await screen.findByTestId('interests-chip-Fantasy')).toBeInTheDocument();
    const call = fetchMock.mock.calls.find(
      ([path, init]) => path === '/api/interests' && init?.method === 'PUT',
    );
    expect(JSON.parse(String(call?.[1]?.body))).toEqual({ genreIds: [5], languageIds: [] });
  });

  it('disables further options at 10 interests', async () => {
    const current = { genres: genres.slice(0, 9), languages: [languages[0]], prompted: true };
    mockFetch(pageRoutes(current));
    renderPage();
    await screen.findByTestId('interests-chip-Art');

    await userEvent.click(screen.getByTestId('interests-edit'));
    expect(screen.getByTestId('interests-count')).toHaveTextContent('10 / 10');
    await userEvent.type(screen.getByTestId('interests-languages'), 'fre');

    expect(await screen.findByRole('option', { name: 'French' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('shows the error when saving interests fails', async () => {
    mockFetch(
      pageRoutes(prompted, {
        'PUT /api/interests': { status: 400, body: { message: 'Choose at most 10 interests' } },
      }),
    );
    renderPage();
    await screen.findByTestId('interests-empty');

    await userEvent.click(screen.getByTestId('interests-edit'));
    await userEvent.click(screen.getByTestId('interests-confirm'));

    expect(await screen.findByTestId('interests-error')).toHaveTextContent(
      'Choose at most 10 interests',
    );
  });

  it('shows the error when interests fail to load', async () => {
    mockFetch({
      'GET /api/interests/options': { status: 500, body: { message: 'Server down' } },
      'GET /api/interests': { status: 500, body: { message: 'Server down' } },
      'GET /api/loans': { status: 200, body: emptyHistory },
    });
    renderPage();

    expect(await screen.findByTestId('interests-error')).toHaveTextContent('Server down');
  });
});
