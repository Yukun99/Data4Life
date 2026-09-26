import RequireAdmin from '@/app/require-admin';
import { User } from '@/store/user-slice';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { ada, admin } from '../users';
import withStore from '../with-store';

const renderAt = (user: User) =>
  render(
    withStore(
      <MemoryRouter initialEntries={['/users']}>
        <Routes>
          <Route path="/" element={<p>home route</p>} />
          <Route element={<RequireAdmin />}>
            <Route path="/users" element={<p>users route</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
      { user },
    ).ui,
  );

describe('RequireAdmin', () => {
  it('sends a non-admin home', () => {
    renderAt(ada);

    expect(screen.getByText('home route')).toBeInTheDocument();
    expect(screen.queryByText('users route')).not.toBeInTheDocument();
  });

  it('lets an admin through', () => {
    renderAt(admin);

    expect(screen.getByText('users route')).toBeInTheDocument();
  });
});
