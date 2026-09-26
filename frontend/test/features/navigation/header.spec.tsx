import theme from '@/app/theme';
import Header from '@/features/navigation/header';
import { User } from '@/store/user-slice';
import { ThemeProvider } from '@mui/material/styles';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { ada, admin } from '../../users';
import withStore from '../../with-store';

const NON_ADMIN_IDS = ['nav-home', 'nav-borrow', 'nav-return', 'nav-reserve', 'nav-profile'];

const renderHeader = (user: User) =>
  render(
    withStore(
      <ThemeProvider theme={theme} defaultMode="light">
        <MemoryRouter initialEntries={['/']}>
          <Header />
          <Routes>
            <Route path="/" element={<p>home route</p>} />
            <Route path="/borrow" element={<p>borrow route</p>} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>,
      { user },
    ).ui,
  );

describe('Header', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
    }));
  });

  it('opens the drawer with the regular pages only', async () => {
    renderHeader(ada);

    await userEvent.click(screen.getByTestId('header-menu'));

    for (const id of NON_ADMIN_IDS) {
      expect(await screen.findByTestId(id)).toBeInTheDocument();
    }
    expect(screen.queryByTestId('nav-users')).not.toBeInTheDocument();
    expect(screen.queryByTestId('nav-catalogue')).not.toBeInTheDocument();
  });

  it('shows the admin pages to an admin', async () => {
    renderHeader(admin);

    await userEvent.click(screen.getByTestId('header-menu'));

    expect(await screen.findByTestId('nav-users')).toBeInTheDocument();
    expect(screen.getByTestId('nav-catalogue')).toBeInTheDocument();
  });

  it('navigates and closes the drawer on a link click', async () => {
    renderHeader(ada);

    await userEvent.click(screen.getByTestId('header-menu'));
    await userEvent.click(await screen.findByTestId('nav-borrow'));

    expect(await screen.findByText('borrow route')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByTestId('nav-borrow')).not.toBeInTheDocument());
  });

  it('switches the document colour scheme between light and dark', async () => {
    renderHeader(ada);

    const toggle = screen.getByTestId('header-theme');
    expect(toggle).toHaveAttribute('aria-label', 'Switch to dark mode');

    await userEvent.click(toggle);
    expect(document.documentElement.getAttribute('data-mui-color-scheme')).toBe('dark');
    expect(toggle).toHaveAttribute('aria-label', 'Switch to light mode');

    await userEvent.click(toggle);
    expect(document.documentElement.getAttribute('data-mui-color-scheme')).toBe('light');
    expect(toggle).toHaveAttribute('aria-label', 'Switch to dark mode');
  });
});
