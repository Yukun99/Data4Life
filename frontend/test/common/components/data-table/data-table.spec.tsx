import DataTable from '@/common/components/data-table/data-table';
import { ColumnSpec, SortState } from '@/common/components/data-table/types';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

type Row = { id: number; name: string; email: string };
type ColumnKey = 'person' | 'id' | 'actions';
type SortKey = 'name' | 'email' | 'id';

const rows: Row[] = [
  { id: 1, name: 'Ada', email: 'ada@example.com' },
  { id: 2, name: 'Bob', email: 'bob@example.com' },
];

const columns: ColumnSpec<Row, ColumnKey, SortKey>[] = [
  {
    key: 'person',
    headers: [
      { label: 'Name', sortKey: 'name' },
      { label: 'Email', sortKey: 'email' },
    ],
    lines: (row) => [row.name, row.email],
  },
  { key: 'id', headers: [{ label: 'Id', sortKey: 'id' }], lines: (row) => [String(row.id)] },
  {
    key: 'actions',
    headers: [{ label: 'Actions' }],
    render: (row) => <button data-testid={`open-${row.id}`}>Open</button>,
  },
];

const widths = { person: 50, id: 30, actions: 20 };

type RenderParams = {
  sort?: SortState<SortKey>;
  data?: Row[];
  loading?: boolean;
  error?: string;
  flashKey?: number | null;
};

const renderTable = ({
  sort = null,
  data = rows,
  loading = false,
  error = '',
  flashKey = null,
}: RenderParams = {}) => {
  const props = {
    onToggleSort: vi.fn(),
    onSwitchSort: vi.fn(),
    onWidthsChange: vi.fn(),
    onWidthsCommit: vi.fn(),
    onFlashEnd: vi.fn(),
  };
  render(
    <DataTable
      columns={columns}
      rows={data}
      rowKey={(row) => row.id}
      rowTestId={(row) => `row-${row.id}`}
      sort={sort}
      widths={widths}
      loading={loading}
      error={error}
      emptyText="Nothing here"
      testIdPrefix="people"
      flashKey={flashKey}
      {...props}
    />,
  );
  return props;
};

describe('DataTable', () => {
  it('renders stacked headers, stacked values and custom cells', () => {
    renderTable();

    expect(screen.getByTestId('sort-name')).toBeInTheDocument();
    expect(screen.getByTestId('sort-email')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
    expect(screen.getByTestId('col-person')).toHaveStyle({ width: '50%' });
    expect(screen.getByText('Ada')).toHaveAttribute('title', 'Ada');
    expect(screen.getByText('ada@example.com')).toHaveStyle({ textOverflow: 'ellipsis' });
    expect(screen.getByText('ada@example.com')).toHaveClass('MuiTypography-root');
    expect(screen.getByTestId('row-2')).toHaveTextContent('bob@example.com');
    expect(screen.getByTestId('open-1')).toBeInTheDocument();
  });

  it('shows the secondary lines in the secondary text colour', () => {
    renderTable();

    const primary = getComputedStyle(screen.getByText('Ada')).color;
    const secondary = getComputedStyle(screen.getByText('ada@example.com')).color;
    expect(secondary).not.toBe(primary);
  });

  it('puts a divider on every column but the last', () => {
    renderTable();

    expect(screen.getByTestId('resize-person')).toBeInTheDocument();
    expect(screen.getByTestId('resize-id')).toBeInTheDocument();
    expect(screen.queryByTestId('resize-actions')).not.toBeInTheDocument();
  });

  it('toggles the sort from a single header and an unsorted stacked header', async () => {
    const props = renderTable();

    await userEvent.click(screen.getByTestId('sort-id'));
    await userEvent.click(screen.getByTestId('sort-name'));

    expect(props.onToggleSort).toHaveBeenCalledWith('id');
    expect(props.onToggleSort).toHaveBeenCalledWith('name');
  });

  it('switches to the other stacked key while a sort is active', async () => {
    const props = renderTable({ sort: { key: 'name', dir: 'desc' } });

    await userEvent.click(screen.getByTestId('sort-email'));

    expect(props.onSwitchSort).toHaveBeenCalledWith('email');
    expect(props.onToggleSort).not.toHaveBeenCalled();
  });

  it('shows the error instead of the loading and empty rows', () => {
    renderTable({ data: [], loading: true, error: 'Boom' });
    expect(screen.getByTestId('people-error')).toHaveTextContent('Boom');
    expect(screen.queryByTestId('people-loading')).not.toBeInTheDocument();
    expect(screen.queryByTestId('people-empty')).not.toBeInTheDocument();
  });

  it('shows a spinner only while loading an empty list', () => {
    renderTable({ data: [], loading: true });
    expect(screen.getByTestId('people-loading')).toBeInTheDocument();
    expect(screen.queryByTestId('people-empty')).not.toBeInTheDocument();
  });

  it('shows the empty text', () => {
    renderTable({ data: [] });
    expect(screen.getByTestId('people-empty')).toHaveTextContent('Nothing here');
    expect(screen.queryByTestId('people-loading')).not.toBeInTheDocument();
  });

  it('updates widths while dragging and commits once on release', () => {
    const props = renderTable();
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      width: 1000,
    } as DOMRect);

    fireEvent.pointerDown(screen.getByTestId('resize-person'), { clientX: 100 });
    fireEvent.pointerMove(window, { clientX: 150 });
    fireEvent.pointerMove(window, { clientX: 200 });
    fireEvent.pointerUp(window, { clientX: 200 });
    fireEvent.pointerMove(window, { clientX: 400 });

    expect(props.onWidthsChange).toHaveBeenCalledTimes(2);
    expect(props.onWidthsChange).toHaveBeenLastCalledWith({ person: 60, id: 20, actions: 20 });
    expect(props.onWidthsCommit).toHaveBeenCalledTimes(1);
    expect(props.onWidthsCommit).toHaveBeenCalledWith({ person: 60, id: 20, actions: 20 });
  });

  it('flashes and scrolls to the matching row and reports the end of the animation', () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    const props = renderTable({ flashKey: 2 });

    const row = screen.getByTestId('row-2');
    expect(row).toHaveAttribute('data-flash', 'true');
    expect(screen.getByTestId('row-1')).not.toHaveAttribute('data-flash');
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'center' });

    fireEvent.animationEnd(screen.getByTestId('row-1'));
    expect(props.onFlashEnd).not.toHaveBeenCalled();
    fireEvent.animationEnd(row);
    expect(props.onFlashEnd).toHaveBeenCalledTimes(1);
  });

  it('flashes no row without a flash key', () => {
    renderTable();

    expect(screen.getByTestId('row-1')).not.toHaveAttribute('data-flash');
    expect(screen.getByTestId('row-2')).not.toHaveAttribute('data-flash');
  });
});
