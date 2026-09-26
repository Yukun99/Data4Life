import AuthProvider from '@/common/contexts/auth-context';
import CreatePage from '@/pages/create/create-page';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import mockFetch from '../../mock-fetch';

const user = { id: 1, name: 'Ada', email: 'ada@example.com', createdAt: '2026-01-01T00:00:00Z' };

const renderCreate = () =>
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/create']}>
        <Routes>
          <Route path="/create" element={<CreatePage />} />
          <Route path="/profile" element={<p>profile route</p>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );

const fillAndSubmit = async (password = 'secret123') => {
  await userEvent.type(screen.getByTestId('create-name'), 'Ada');
  await userEvent.type(screen.getByTestId('create-email'), 'ada@example.com');
  await userEvent.type(screen.getByTestId('create-password'), password);
  await userEvent.click(screen.getByTestId('create-submit'));
};

describe('CreatePage', () => {
  it('posts the new user, logs in and goes to the profile', async () => {
    const fetchMock = mockFetch({
      'POST /api/users': { status: 201, body: user },
      'POST /api/auth/login': { status: 200, body: user },
    });
    renderCreate();

    await fillAndSubmit();

    expect(await screen.findByText('profile route')).toBeInTheDocument();
    const createCall = fetchMock.mock.calls.find(([path]) => path === '/api/users');
    expect(JSON.parse(String(createCall?.[1]?.body))).toEqual({
      name: 'Ada',
      email: 'ada@example.com',
      password: 'secret123',
    });
  });

  it('shows the conflict message when the email is taken', async () => {
    mockFetch({
      'POST /api/users': {
        status: 409,
        body: { message: 'An account with this email already exists' },
      },
    });
    renderCreate();

    await fillAndSubmit();

    expect(await screen.findByTestId('create-error')).toHaveTextContent(
      'An account with this email already exists',
    );
  });

  it('blocks a password with spaces before calling the API', async () => {
    const fetchMock = mockFetch({});
    renderCreate();

    await fillAndSubmit('has spaces 1');

    expect(await screen.findByText('Use 8 to 32 characters with no spaces')).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([path]) => path === '/api/users')).toBe(false);
  });
});
