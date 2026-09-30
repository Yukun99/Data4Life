import LoginPage from '@/pages/login/login-page';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import mockFetch from '../../mock-fetch';
import { ada } from '../../users';
import withStore from '../../with-store';

const renderLogin = () => {
  const { store, ui } = withStore(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/borrow" element={<p>borrow route</p>} />
      </Routes>
    </MemoryRouter>,
  );
  render(ui);
  return store;
};

const fillAndSubmit = async (password: string) => {
  await userEvent.type(screen.getByTestId('login-email'), 'ada@example.com');
  await userEvent.type(screen.getByTestId('login-password'), password);
  await userEvent.click(screen.getByTestId('login-submit'));
};

describe('LoginPage', () => {
  it('posts the credentials, stores the user and goes to the borrow page', async () => {
    const fetchMock = mockFetch({ 'POST /api/auth/login': { status: 200, body: ada } });
    const store = renderLogin();

    await fillAndSubmit('secret123');

    expect(await screen.findByText('borrow route')).toBeInTheDocument();
    expect(store.getState().user.user).toEqual(ada);
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
