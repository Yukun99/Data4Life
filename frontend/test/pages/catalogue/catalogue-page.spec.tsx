import CataloguePage from '@/pages/catalogue/catalogue-page';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import mockFetch from '../../mock-fetch';
import { admin } from '../../users';
import withStore from '../../with-store';

const fantasy = { id: 5, name: 'Fantasy' };
const literary = { id: 8, name: 'Literary Fiction' };
const english = { id: 1, name: 'English' };
const japanese = { id: 5, name: 'Japanese' };

const dune = {
  isbn: '111',
  title: 'Dune',
  author: 'Frank Herbert',
  genre: fantasy,
  language: english,
  amount: 3,
  stock: 2,
};

const kokoro = {
  isbn: '222',
  title: 'Kokoro',
  author: 'Natsume Soseki',
  genre: literary,
  language: japanese,
  amount: 2,
  stock: 2,
};

const filters = {
  isbn: ['111', '222'],
  title: ['Dune', 'Kokoro'],
  author: ['Frank Herbert', 'Natsume Soseki'],
  genre: [fantasy, literary],
  language: [english, japanese],
  amount: [2, 3],
  stock: [2],
};

type MockRoutes = Parameters<typeof mockFetch>[0];
type FetchMock = ReturnType<typeof mockFetch>;

const list = (query: string, page = 0, totalPages = 3): MockRoutes => ({
  [`GET /api/books?${query}`]: {
    status: 200,
    body: { books: [dune, kokoro], page, totalPages, total: totalPages * 10, filters },
  },
});

const FIRST = '/api/books?page=0&size=10';

const renderPage = (routes: MockRoutes = {}) => {
  const fetchMock = mockFetch({ ...list('page=0&size=10'), ...routes });
  const { store, ui } = withStore(
    <MemoryRouter>
      <CataloguePage />
    </MemoryRouter>,
    { user: admin },
  );
  render(ui);
  return { fetchMock, store };
};

const calls = (fetchMock: FetchMock, url: string) =>
  fetchMock.mock.calls.filter(([input]) => String(input) === url).length;

const called = (fetchMock: FetchMock, url: string, times = 1) =>
  waitFor(() => expect(calls(fetchMock, url)).toBeGreaterThanOrEqual(times));

const bodyOf = (fetchMock: FetchMock, url: string, method: string) => {
  const call = fetchMock.mock.calls.find(([input, init]) => input === url && init?.method === method);
  return JSON.parse(String(call?.[1]?.body));
};

const pick = async (testId: string, typed: string, option: string) => {
  await userEvent.type(screen.getByTestId(testId), typed);
  await userEvent.click(await screen.findByRole('option', { name: option }));
};

describe('CataloguePage', () => {
  it('renders the rows and offers filter options', async () => {
    renderPage();

    expect(await screen.findByTestId('book-row-111')).toHaveTextContent('Dune');
    expect(screen.getByTestId('book-row-111')).toHaveTextContent('Frank Herbert');
    expect(screen.getByTestId('book-row-222')).toHaveTextContent('Japanese');
    expect(screen.getByTestId('catalogue-total-pages')).toHaveTextContent('/ 3');

    await userEvent.click(screen.getByTestId('catalogue-filter'));
    await userEvent.click(screen.getByTestId('filter-genre'));

    expect(await screen.findByRole('option', { name: 'Literary Fiction' })).toBeInTheDocument();
  });

  it('shows an empty state and a load error', async () => {
    const { fetchMock } = renderPage({
      'GET /api/books?page=0&size=10': {
        status: 200,
        body: { books: [], page: 0, totalPages: 0, total: 0, filters },
      },
      'GET /api/books?page=0&size=10&title=Dune': { status: 500, body: { message: 'Boom' } },
    });

    expect(await screen.findByTestId('catalogue-empty')).toHaveTextContent('No books found');

    await userEvent.click(screen.getByTestId('catalogue-filter'));
    await pick('filter-title', 'Du', 'Dune');
    await userEvent.click(screen.getByTestId('filter-apply'));

    await called(fetchMock, '/api/books?page=0&size=10&title=Dune');
    expect(await screen.findByTestId('catalogue-error')).toHaveTextContent('Boom');
  });

  it('moves between pages with the buttons', async () => {
    const { fetchMock } = renderPage({
      ...list('page=1&size=10', 1),
      ...list('page=2&size=10', 2),
    });
    await screen.findByTestId('book-row-111');
    const input = screen.getByTestId('catalogue-page-input');

    await userEvent.click(screen.getByTestId('catalogue-next'));
    await waitFor(() => expect(input).toHaveValue('2'));
    await userEvent.click(screen.getByTestId('catalogue-last'));
    await waitFor(() => expect(input).toHaveValue('3'));
    expect(screen.getByTestId('catalogue-next')).toBeDisabled();
    await userEvent.click(screen.getByTestId('catalogue-prev'));
    await waitFor(() => expect(input).toHaveValue('2'));
    await userEvent.click(screen.getByTestId('catalogue-first'));
    await waitFor(() => expect(input).toHaveValue('1'));

    expect(calls(fetchMock, '/api/books?page=1&size=10')).toBe(2);
    expect(calls(fetchMock, '/api/books?page=2&size=10')).toBe(1);
    expect(calls(fetchMock, FIRST)).toBe(2);
  });

  it('commits a typed page on Enter and on blur', async () => {
    const { fetchMock } = renderPage({
      ...list('page=1&size=10', 1),
      ...list('page=2&size=10', 2),
    });
    await screen.findByTestId('book-row-111');
    const input = screen.getByTestId('catalogue-page-input');

    await userEvent.clear(input);
    await userEvent.type(input, '3{Enter}');
    await called(fetchMock, '/api/books?page=2&size=10');

    await userEvent.clear(input);
    await userEvent.type(input, '2');
    await userEvent.tab();
    await called(fetchMock, '/api/books?page=1&size=10');
    await waitFor(() => expect(input).toHaveValue('2'));
  });

  it('resets to the first page when the page size changes', async () => {
    const { fetchMock } = renderPage({
      ...list('page=1&size=10', 1),
      ...list('page=0&size=20', 0, 2),
    });
    await screen.findByTestId('book-row-111');

    await userEvent.click(screen.getByTestId('catalogue-next'));
    await called(fetchMock, '/api/books?page=1&size=10');
    await userEvent.selectOptions(screen.getByTestId('catalogue-size'), '20');

    await called(fetchMock, '/api/books?page=0&size=20');
    await waitFor(() => expect(screen.getByTestId('catalogue-page-input')).toHaveValue('1'));
  });

  it('applies a genre filter', async () => {
    const { fetchMock } = renderPage(list('page=0&size=10&genreId=5', 0, 1));
    await screen.findByTestId('book-row-111');

    await userEvent.click(screen.getByTestId('catalogue-filter'));
    await pick('filter-genre', 'Fan', 'Fantasy');
    await userEvent.click(screen.getByTestId('filter-apply'));

    await called(fetchMock, '/api/books?page=0&size=10&genreId=5');
    await waitFor(() =>
      expect(screen.getByTestId('catalogue-filter-count')).toHaveTextContent('1'),
    );
  });

  it('cycles the sort and switches keys in a combined header', async () => {
    const { fetchMock } = renderPage({
      ...list('page=0&size=10&sort=title&dir=asc'),
      ...list('page=0&size=10&sort=title&dir=desc'),
      ...list('page=0&size=10&sort=author&dir=desc'),
    });
    await screen.findByTestId('book-row-111');

    await userEvent.click(screen.getByTestId('sort-title'));
    await called(fetchMock, '/api/books?page=0&size=10&sort=title&dir=asc');
    expect(screen.getByTestId('sort-title-label')).toHaveStyle({
      fontWeight: '700',
      textDecoration: 'underline',
    });

    await userEvent.click(screen.getByTestId('sort-title'));
    await called(fetchMock, '/api/books?page=0&size=10&sort=title&dir=desc');

    await userEvent.click(screen.getByTestId('sort-title'));
    await called(fetchMock, FIRST, 2);
    expect(screen.getByTestId('sort-title')).toHaveAttribute('data-dir', 'none');

    await userEvent.click(screen.getByTestId('sort-title'));
    await userEvent.click(screen.getByTestId('sort-title'));
    await userEvent.click(screen.getByTestId('sort-author'));
    await called(fetchMock, '/api/books?page=0&size=10&sort=author&dir=desc');
    expect(screen.getByTestId('sort-author')).toHaveAttribute('data-dir', 'desc');
    expect(screen.getByTestId('sort-title')).toHaveAttribute('data-dir', 'none');
  });

  it('adds a book and reloads the list', async () => {
    const { fetchMock } = renderPage({ 'POST /api/books': { status: 201, body: dune } });
    await screen.findByTestId('book-row-111');

    await userEvent.click(screen.getByTestId('catalogue-add'));
    await userEvent.click(screen.getByTestId('book-save'));
    expect(screen.getByText('ISBN is required')).toBeInTheDocument();
    expect(screen.getByText('Genre is required')).toBeInTheDocument();

    await userEvent.type(screen.getByTestId('book-isbn-input'), ' 333 ');
    await userEvent.type(screen.getByTestId('book-title-input'), 'New');
    await userEvent.type(screen.getByTestId('book-author-input'), 'Someone');
    await pick('book-genre', 'Fan', 'Fantasy');
    await pick('book-language', 'Jap', 'Japanese');
    await userEvent.type(screen.getByTestId('book-amount-input'), '4');
    await userEvent.click(screen.getByTestId('book-save'));

    await waitFor(() => expect(screen.queryByTestId('book-dialog')).not.toBeInTheDocument());
    expect(bodyOf(fetchMock, '/api/books', 'POST')).toEqual({
      isbn: '333',
      title: 'New',
      author: 'Someone',
      genreId: 5,
      languageId: 5,
      amount: 4,
    });
    await called(fetchMock, FIRST, 2);
  });

  it('shows the error when the ISBN already exists', async () => {
    renderPage({ 'POST /api/books': { status: 409, body: { message: 'ISBN already exists' } } });
    await screen.findByTestId('book-row-111');

    await userEvent.click(screen.getByTestId('catalogue-add'));
    await userEvent.type(screen.getByTestId('book-isbn-input'), '111');
    await userEvent.type(screen.getByTestId('book-title-input'), 'Dune');
    await userEvent.type(screen.getByTestId('book-author-input'), 'Frank Herbert');
    await pick('book-genre', 'Fan', 'Fantasy');
    await pick('book-language', 'Eng', 'English');
    await userEvent.type(screen.getByTestId('book-amount-input'), '1');
    await userEvent.click(screen.getByTestId('book-save'));

    expect(await screen.findByTestId('book-error')).toHaveTextContent('ISBN already exists');
  });

  it('edits a book and keeps the amount above the copies on loan', async () => {
    const { fetchMock } = renderPage({
      'PUT /api/books/111': { status: 200, body: { ...dune, title: 'Dune Messiah' } },
    });
    await screen.findByTestId('book-row-111');

    await userEvent.click(screen.getByTestId('book-edit-111'));
    expect(screen.getByTestId('book-stock')).toHaveTextContent('Stock: 2 (1 on loan)');
    await userEvent.clear(screen.getByTestId('book-amount-input'));
    await userEvent.type(screen.getByTestId('book-amount-input'), '0');
    await userEvent.click(screen.getByTestId('book-save'));
    expect(screen.getByText('Amount cannot be below the 1 on loan')).toBeInTheDocument();

    await userEvent.clear(screen.getByTestId('book-amount-input'));
    await userEvent.type(screen.getByTestId('book-amount-input'), '5');
    await userEvent.clear(screen.getByTestId('book-title-input'));
    await userEvent.type(screen.getByTestId('book-title-input'), 'Dune Messiah');
    await userEvent.click(screen.getByTestId('book-save'));

    await waitFor(() => expect(screen.queryByTestId('book-dialog')).not.toBeInTheDocument());
    expect(bodyOf(fetchMock, '/api/books/111', 'PUT')).toEqual({
      isbn: '111',
      title: 'Dune Messiah',
      author: 'Frank Herbert',
      genreId: 5,
      languageId: 1,
      amount: 5,
    });
    await called(fetchMock, FIRST, 2);
  });

  it('hands an ISBN clash over to the merge dialog', async () => {
    const { fetchMock } = renderPage({
      'PUT /api/books/111': { status: 409, body: { message: 'ISBN already exists' } },
      'GET /api/books/222': { status: 200, body: kokoro },
      'POST /api/books/111/merge': { status: 200, body: kokoro },
    });
    await screen.findByTestId('book-row-111');

    await userEvent.click(screen.getByTestId('book-edit-111'));
    await userEvent.clear(screen.getByTestId('book-isbn-input'));
    await userEvent.type(screen.getByTestId('book-isbn-input'), '222');
    await userEvent.click(screen.getByTestId('book-save'));

    expect(await screen.findByTestId('merge-message')).toHaveTextContent(
      'ISBN 222 already exists.',
    );
    expect(fetchMock).toHaveBeenCalledWith('/api/books/222', expect.anything());
    expect(screen.getByTestId('merge-amount-input')).toHaveValue('5');
    expect(screen.getByTestId('merge-stock')).toHaveTextContent('Stock after merge: 4');

    await userEvent.click(screen.getByTestId('merge-title-target'));
    await userEvent.click(screen.getByTestId('merge-confirm'));

    await waitFor(() => expect(screen.queryByTestId('merge-dialog')).not.toBeInTheDocument());
    expect(bodyOf(fetchMock, '/api/books/111/merge', 'POST')).toEqual({
      isbn: '222',
      title: 'Kokoro',
      author: 'Frank Herbert',
      genreId: 5,
      languageId: 1,
      amount: 5,
    });
    await called(fetchMock, FIRST, 2);
  });

  it('deletes a book after confirming', async () => {
    const { fetchMock } = renderPage({ 'DELETE /api/books/222': { status: 204 } });
    await screen.findByTestId('book-row-111');

    await userEvent.click(screen.getByTestId('book-delete-222'));
    expect(screen.getByTestId('delete-dialog')).toHaveTextContent('Delete Kokoro?');
    await userEvent.click(screen.getByTestId('delete-confirm'));

    await waitFor(() => expect(screen.queryByTestId('delete-dialog')).not.toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/books/222',
      expect.objectContaining({ method: 'DELETE' }),
    );
    await called(fetchMock, FIRST, 2);
  });

  it('shows why a book with loans cannot be deleted', async () => {
    renderPage({
      'DELETE /api/books/111': { status: 409, body: { message: 'Book has loan records' } },
    });
    await screen.findByTestId('book-row-111');

    await userEvent.click(screen.getByTestId('book-delete-111'));
    await userEvent.click(screen.getByTestId('delete-confirm'));

    expect(await screen.findByTestId('delete-error')).toHaveTextContent('Book has loan records');
  });
});
