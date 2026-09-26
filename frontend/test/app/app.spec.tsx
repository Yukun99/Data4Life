import App from '@/app/app';
import { render, screen } from '@testing-library/react';
import mockFetch from '../mock-fetch';

describe('App', () => {
  it('sends a logged-out visitor to the login form', async () => {
    mockFetch({ 'GET /api/auth/me': { status: 401 } });
    render(<App />);

    expect(await screen.findByTestId('login-email')).toBeInTheDocument();
    expect(window.location.pathname).toBe('/login');
    expect(document.title).toBe('Library - Login');
  });
});
