import DocumentTitle from '@/app/document-title';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <DocumentTitle />
    </MemoryRouter>,
  );

describe('DocumentTitle', () => {
  it.each([
    ['/', 'Library - Home'],
    ['/login', 'Library - Login'],
    ['/create', 'Library - Create Account'],
    ['/profile', 'Library - Profile'],
    ['/nowhere', 'Library'],
  ])('titles %s as %s', (path, title) => {
    renderAt(path);

    expect(document.title).toBe(title);
  });
});
