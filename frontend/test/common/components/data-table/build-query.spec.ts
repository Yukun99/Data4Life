import { buildQuery } from '@/common/components/data-table/build-query';

const filterKeys: ('title' | 'genreId' | 'stock')[] = ['title', 'genreId', 'stock'];
const empty = { title: '', genreId: '', stock: '' };

describe('buildQuery', () => {
  it('writes page and size only when nothing else is set', () => {
    expect(buildQuery({ page: 2, size: 20, sort: null, filter: empty, filterKeys })).toBe(
      'page=2&size=20',
    );
  });

  it('keeps a fixed order and skips empty filters', () => {
    expect(
      buildQuery({
        page: 0,
        size: 10,
        sort: { key: 'genre', dir: 'desc' },
        filter: { stock: '1', title: 'Dune', genreId: '' },
        filterKeys,
      }),
    ).toBe('page=0&size=10&sort=genre&dir=desc&title=Dune&stock=1');
  });
});
