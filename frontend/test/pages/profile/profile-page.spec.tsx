import ProfilePage from '@/pages/profile/profile-page';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import mockFetch from '../../mock-fetch';
import { ada } from '../../users';
import withStore from '../../with-store';

describe('ProfilePage', () => {
  it('shows the user and logs out', async () => {
    const fetchMock = mockFetch({ 'POST /api/auth/logout': { status: 204 } });
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

    expect(screen.getByTestId('profile-name')).toHaveTextContent('Ada');
    expect(screen.getByTestId('profile-email')).toHaveTextContent('ada@example.com');
    expect(screen.getByTestId('profile-created')).toHaveTextContent('2026');

    await userEvent.click(screen.getByTestId('profile-logout'));

    expect(await screen.findByText('login route')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/logout', expect.anything());
    expect(store.getState().user.user).toBeNull();
  });
});
