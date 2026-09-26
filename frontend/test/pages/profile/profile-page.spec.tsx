import AuthProvider from '@/common/contexts/auth-context';
import ProfilePage from '@/pages/profile/profile-page';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import mockFetch from '../../mock-fetch';

const user = { id: 1, name: 'Ada', email: 'ada@example.com', createdAt: '2026-01-15T00:00:00Z' };

describe('ProfilePage', () => {
  it('shows the user and logs out', async () => {
    const fetchMock = mockFetch({
      'GET /api/auth/me': { status: 200, body: user },
      'POST /api/auth/logout': { status: 204 },
    });
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/profile']}>
          <Routes>
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/login" element={<p>login route</p>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>,
    );

    expect(await screen.findByTestId('profile-name')).toHaveTextContent('Ada');
    expect(screen.getByTestId('profile-email')).toHaveTextContent('ada@example.com');
    expect(screen.getByTestId('profile-created')).toHaveTextContent('2026');

    await userEvent.click(screen.getByTestId('profile-logout'));

    expect(await screen.findByText('login route')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/logout', expect.anything());
  });
});
