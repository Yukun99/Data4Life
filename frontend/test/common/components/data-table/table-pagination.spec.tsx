import TablePagination from '@/common/components/data-table/table-pagination';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const renderPagination = (page: number, totalPages: number) => {
  const onGoTo = vi.fn();
  render(
    <TablePagination
      page={page}
      totalPages={totalPages}
      onGoTo={onGoTo}
      testIdPrefix="catalogue"
    />,
  );
  return onGoTo;
};

describe('TablePagination', () => {
  it('disables first and previous on the first page', () => {
    renderPagination(0, 3);

    expect(screen.getByTestId('catalogue-first')).toBeDisabled();
    expect(screen.getByTestId('catalogue-prev')).toBeDisabled();
    expect(screen.getByTestId('catalogue-next')).toBeEnabled();
    expect(screen.getByTestId('catalogue-last')).toBeEnabled();
    expect(screen.getByTestId('catalogue-page-input')).toHaveValue('1');
    expect(screen.getByTestId('catalogue-total-pages')).toHaveTextContent('/ 3');
  });

  it('disables next and last on the last page', () => {
    renderPagination(2, 3);

    expect(screen.getByTestId('catalogue-first')).toBeEnabled();
    expect(screen.getByTestId('catalogue-prev')).toBeEnabled();
    expect(screen.getByTestId('catalogue-next')).toBeDisabled();
    expect(screen.getByTestId('catalogue-last')).toBeDisabled();
  });

  it('disables everything with a single page', () => {
    renderPagination(0, 0);

    expect(screen.getByTestId('catalogue-next')).toBeDisabled();
    expect(screen.getByTestId('catalogue-total-pages')).toHaveTextContent('/ 1');
  });

  it('clamps a typed page into range', async () => {
    const onGoTo = renderPagination(0, 3);
    const input = screen.getByTestId('catalogue-page-input');

    await userEvent.clear(input);
    await userEvent.type(input, '9{Enter}');
    expect(onGoTo).toHaveBeenLastCalledWith(2);

    await userEvent.clear(input);
    await userEvent.type(input, '0');
    await userEvent.tab();
    expect(onGoTo).toHaveBeenCalledTimes(1);
    expect(input).toHaveValue('1');
  });

  it('reverts input that is not a number', async () => {
    const onGoTo = renderPagination(1, 3);
    const input = screen.getByTestId('catalogue-page-input');

    await userEvent.clear(input);
    await userEvent.type(input, 'abc{Enter}');

    expect(onGoTo).not.toHaveBeenCalled();
    expect(input).toHaveValue('2');
  });
});
