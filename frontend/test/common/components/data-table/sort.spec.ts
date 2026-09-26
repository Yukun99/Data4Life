import {
  cycleSort,
  keepDirSort,
  MIN_COLUMN_PERCENT,
  resizeColumns,
} from '@/common/components/data-table/sort';

type Key = 'a' | 'b' | 'c';

const order: Key[] = ['a', 'b', 'c'];
const widths = { a: 30, b: 50, c: 20 };

describe('sort helpers', () => {
  it('cycleSort goes asc, desc, off and restarts on a new key', () => {
    const asc = cycleSort<Key>(null, 'a');
    expect(asc).toEqual({ key: 'a', dir: 'asc' });
    const desc = cycleSort(asc, 'a');
    expect(desc).toEqual({ key: 'a', dir: 'desc' });
    expect(cycleSort(desc, 'a')).toBeNull();
    expect(cycleSort(desc, 'b')).toEqual({ key: 'b', dir: 'asc' });
  });

  it('keepDirSort changes the key and keeps the direction', () => {
    expect(keepDirSort<Key>(null, 'b')).toEqual({ key: 'b', dir: 'asc' });
    expect(keepDirSort<Key>({ key: 'a', dir: 'desc' }, 'b')).toEqual({ key: 'b', dir: 'desc' });
  });

  it('resizeColumns keeps the total and the minimum', () => {
    const grown = resizeColumns({ order, widths, key: 'a', delta: 3.26 });
    expect(grown).toEqual({ a: 33.3, b: 46.7, c: 20 });

    const clamped = resizeColumns({ order, widths, key: 'b', delta: 50 });
    expect(clamped.c).toBe(MIN_COLUMN_PERCENT);
    expect(clamped.b).toBe(widths.b + widths.c - MIN_COLUMN_PERCENT);

    const shrunk = resizeColumns({ order, widths, key: 'a', delta: -50 });
    expect(shrunk.a).toBe(MIN_COLUMN_PERCENT);

    expect(resizeColumns({ order, widths, key: 'c', delta: 5 })).toEqual(widths);
  });
});
