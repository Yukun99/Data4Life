import AuthProvider from '@/common/contexts/auth-context';
import LoginPage from '@/pages/login/login-page';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import mockFetch from '../../mock-fetch';

const user = { id: 1, name: 'Ada', email: 'ada@example.com', createdAt: '2026-01-01T00:00:00Z' };

const renderLogin = () =>
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/profile" element={<p>profile route</p>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );

const fillAndSubmit = async (password: string) => {
  await userEvent.type(screen.getByTestId('login-email'), 'ada@example.com');
  await userEvent.type(screen.getByTestId('login-password'), password);
  await userEvent.click(screen.getByTestId('login-submit'));
};

describe('LoginPage', () => {
  it('posts the credentials and goes to the profile', async () => {
    const fetchMock = mockFetch({ 'POST /api/auth/login': { status: 200, body: user } });
    renderLogin();

    await fillAndSubmit('secret123');

    expect(await screen.findByText('profile route')).toBeInTheDocument();
    const loginCall = fetchMock.mock.calls.find(([path]) => path === '/api/auth/login');
    expect(JSON.parse(String(loginCall?.[1]?.body))).toEqual({
      email: 'ada@example.com',
      password: 'secret123',
    });
  });

  it('shows the error on bad credentials', async () => {
    mockFetch({
      'POST /api/auth/login': { status: 401, body: { message: 'Incorrect email or password' } },
    });
    renderLogin();

    await fillAndSubmit('wrong-password');

    expect(await screen.findByTestId('login-error')).toHaveTextContent(
      'Incorrect email or password',
    );
  });
});
