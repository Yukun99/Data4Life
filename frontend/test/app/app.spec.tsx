import App from '@/app/app';
import { render, screen } from '@testing-library/react';

describe('App', () => {
  it('renders the title', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Data4Life' })).toBeInTheDocument();
  });
});
