import SortLabel from '@/common/components/data-table/sort-label';
import { SortState } from '@/common/components/data-table/types';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const renderLabel = (sort: SortState<string>, onClick = vi.fn()) => {
  render(<SortLabel label="Title" sortKey="title" sort={sort} onClick={onClick} />);
  return onClick;
};

describe('SortLabel', () => {
  it('shows no direction when another key is sorted', () => {
    renderLabel({ key: 'author', dir: 'asc' });

    expect(screen.getByTestId('sort-title')).toHaveAttribute('data-dir', 'none');
    expect(screen.getByTestId('sort-title-up')).toHaveAttribute('data-active', 'false');
    expect(screen.getByTestId('sort-title-down')).toHaveAttribute('data-active', 'false');
    expect(screen.getByTestId('sort-title-label')).not.toHaveStyle({ fontWeight: '700' });
  });

  it('highlights the up triangle when ascending', () => {
    renderLabel({ key: 'title', dir: 'asc' });

    expect(screen.getByTestId('sort-title')).toHaveAttribute('data-dir', 'asc');
    expect(screen.getByTestId('sort-title-up')).toHaveAttribute('data-active', 'true');
    expect(screen.getByTestId('sort-title-down')).toHaveAttribute('data-active', 'false');
    expect(screen.getByTestId('sort-title-label')).toHaveStyle({
      fontWeight: '700',
      textDecoration: 'underline',
    });
  });

  it('highlights the down triangle when descending', () => {
    renderLabel({ key: 'title', dir: 'desc' });

    expect(screen.getByTestId('sort-title')).toHaveAttribute('data-dir', 'desc');
    expect(screen.getByTestId('sort-title-up')).toHaveAttribute('data-active', 'false');
    expect(screen.getByTestId('sort-title-down')).toHaveAttribute('data-active', 'true');
  });

  it('calls back with its key on click', async () => {
    const onClick = renderLabel(null);

    await userEvent.click(screen.getByTestId('sort-title'));

    expect(onClick).toHaveBeenCalledWith('title');
  });
});
