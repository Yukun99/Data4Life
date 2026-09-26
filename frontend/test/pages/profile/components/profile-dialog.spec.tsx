import ProfileCard from '@/pages/profile/components/profile-card';
import { selectUser } from '@/store/user-slice';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import mockFetch from '../../../mock-fetch';
import { ada } from '../../../users';
import withStore from '../../../with-store';
import { useAppSelector } from '@/store/hooks';

const ConnectedCard = () => {
  const user = useAppSelector(selectUser);
  return user && <ProfileCard user={user} />;
};

const renderCard = () => {
  const { store, ui } = withStore(
    <MemoryRouter>
      <ConnectedCard />
    </MemoryRouter>,
    { user: ada },
  );
  render(ui);
  return store;
};

const openDialog = async () => {
  await userEvent.click(screen.getByTestId('profile-edit'));
  return screen.findByTestId('profile-dialog');
};

describe('ProfileDialog', () => {
  it('opens prefilled with the current profile', async () => {
    mockFetch({});
    renderCard();

    await openDialog();

    expect(screen.getByTestId('profile-name-input')).toHaveValue('Ada');
    expect(screen.getByTestId('profile-avatar-ACCOUNT')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('profile-avatar-ROCKET')).toHaveAttribute('aria-pressed', 'false');
  });

  it('blocks saving a blank name', async () => {
    const fetchMock = mockFetch({});
    renderCard();
    await openDialog();

    await userEvent.clear(screen.getByTestId('profile-name-input'));
    await userEvent.click(screen.getByTestId('profile-save'));

    expect(await screen.findByText('Name is required')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('saves the new name and icon', async () => {
    const fetchMock = mockFetch({
      'PUT /api/users/me': { status: 200, body: { ...ada, name: 'Ada L', avatar: 'ROCKET' } },
    });
    const store = renderCard();
    await openDialog();

    await userEvent.clear(screen.getByTestId('profile-name-input'));
    await userEvent.type(screen.getByTestId('profile-name-input'), 'Ada L');
    await userEvent.click(screen.getByTestId('profile-avatar-ROCKET'));
    await userEvent.click(screen.getByTestId('profile-save'));

    await waitFor(() =>
      expect(screen.queryByTestId('profile-dialog')).not.toBeInTheDocument(),
    );
    expect(screen.getByTestId('profile-avatar')).toHaveAttribute('data-avatar', 'ROCKET');
    expect(screen.getByTestId('profile-name')).toHaveTextContent('Ada L');
    expect(store.getState().user.user?.avatar).toBe('ROCKET');
    const call = fetchMock.mock.calls.find(([path]) => path === '/api/users/me');
    expect(JSON.parse(String(call?.[1]?.body))).toEqual({ name: 'Ada L', avatar: 'ROCKET' });
  });

  it('shows the backend error', async () => {
    mockFetch({ 'PUT /api/users/me': { status: 400, body: { message: 'Invalid request' } } });
    renderCard();
    await openDialog();

    await userEvent.click(screen.getByTestId('profile-save'));

    expect(await screen.findByTestId('profile-error')).toHaveTextContent('Invalid request');
    expect(screen.getByTestId('profile-dialog')).toBeInTheDocument();
  });

  it('discards changes on cancel', async () => {
    const fetchMock = mockFetch({});
    renderCard();
    await openDialog();

    await userEvent.type(screen.getByTestId('profile-name-input'), 'xyz');
    await userEvent.click(screen.getByTestId('profile-avatar-PETS'));
    await userEvent.click(screen.getByTestId('profile-cancel'));
    await waitFor(() =>
      expect(screen.queryByTestId('profile-dialog')).not.toBeInTheDocument(),
    );

    expect(screen.getByTestId('profile-name')).toHaveTextContent('Ada');
    expect(screen.getByTestId('profile-avatar')).toHaveAttribute('data-avatar', 'ACCOUNT');
    await openDialog();
    expect(screen.getByTestId('profile-name-input')).toHaveValue('Ada');
    expect(screen.getByTestId('profile-avatar-ACCOUNT')).toHaveAttribute('aria-pressed', 'true');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
