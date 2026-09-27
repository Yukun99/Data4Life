import ColumnDivider from '@/common/components/data-table/column-divider';
import SortLabel from '@/common/components/data-table/sort-label';
import { ColumnSpec, HeaderSpec, SortState } from '@/common/components/data-table/types';
import useColumnResize from '@/common/components/data-table/use-column-resize';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { keyframes, Theme } from '@mui/material/styles';
import { ReactNode } from 'react';

type DataTableProps<Row, C extends string, S extends string> = {
  columns: ColumnSpec<Row, C, S>[];
  rows: Row[];
  rowKey: (row: Row) => string | number;
  rowTestId: (row: Row) => string;
  sort: SortState<S>;
  onToggleSort: (key: S) => void;
  onSwitchSort: (key: S) => void;
  widths: Record<C, number>;
  onWidthsChange: (widths: Record<C, number>) => void;
  onWidthsCommit: (widths: Record<C, number>) => void;
  loading: boolean;
  error: string;
  emptyText: string;
  testIdPrefix: string;
  flashKey?: string | number | null;
  onFlashEnd?: () => void;
};

const ellipsis = { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } as const;

const flashSx = (theme: Theme) => {
  const colour = theme.alpha((theme.vars ?? theme).palette.secondary.main, 0.4);
  const flash = keyframes`50% { background-color: ${colour}; }`;
  return { animation: `${flash} 0.6s ease-in-out 3` };
};

const scrollTo = (node: HTMLTableRowElement | null) => node?.scrollIntoView?.({ block: 'center' });

const Line = ({ text, secondary = false }: { text: string; secondary?: boolean }) => (
  <Typography
    variant="body2"
    title={text}
    sx={{ ...ellipsis, color: secondary ? 'text.secondary' : undefined }}
  >
    {text}
  </Typography>
);

const DataTable = <Row, C extends string, S extends string>({
  columns,
  rows,
  rowKey,
  rowTestId,
  sort,
  onToggleSort,
  onSwitchSort,
  widths,
  onWidthsChange,
  onWidthsCommit,
  loading,
  error,
  emptyText,
  testIdPrefix,
  flashKey = null,
  onFlashEnd,
}: DataTableProps<Row, C, S>) => {
  const order = columns.map((column) => column.key);
  const { startResize } = useColumnResize({
    order,
    widths,
    onChange: onWidthsChange,
    onCommit: onWidthsCommit,
  });
  const stacked = (key: S) => (!sort || sort.key === key ? onToggleSort : onSwitchSort);

  const label = ({ label: text, sortKey }: HeaderSpec<S>, onClick: (key: S) => void) =>
    sortKey ? (
      <SortLabel key={sortKey} label={text} sortKey={sortKey} sort={sort} onClick={onClick} />
    ) : (
      <Box key={text} component="span">
        {text}
      </Box>
    );

  const header = (headers: HeaderSpec<S>[]) =>
    headers.length === 1 ? (
      label(headers[0], onToggleSort)
    ) : (
      <Stack sx={{ alignItems: 'flex-start' }}>
        {headers.map((spec) => label(spec, spec.sortKey ? stacked(spec.sortKey) : onToggleSort))}
      </Stack>
    );

  const cell = (column: ColumnSpec<Row, C, S>, row: Row) =>
    column.render ? (
      <TableCell key={column.key} sx={{ whiteSpace: 'nowrap' }}>
        {column.render(row)}
      </TableCell>
    ) : (
      <TableCell key={column.key} sx={ellipsis}>
        {(column.lines?.(row) ?? []).map((text, index) => (
          <Line key={index} text={text} secondary={index > 0} />
        ))}
      </TableCell>
    );

  const message = (content: ReactNode) => (
    <TableRow>
      <TableCell colSpan={columns.length}>{content}</TableCell>
    </TableRow>
  );

  return (
    <TableContainer sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
      <Table stickyHeader size="small" sx={{ tableLayout: 'fixed', width: '100%' }}>
        <colgroup>
          {order.map((key) => (
            <col key={key} style={{ width: `${widths[key]}%` }} data-testid={`col-${key}`} />
          ))}
        </colgroup>
        <TableHead>
          <TableRow>
            {columns.map((column, index) => (
              <TableCell key={column.key} sx={{ position: 'relative', ...ellipsis }}>
                {header(column.headers)}
                {index < columns.length - 1 && (
                  <ColumnDivider columnKey={column.key} onPointerDown={startResize(column.key)} />
                )}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {error &&
            message(
              <Alert severity="error" data-testid={`${testIdPrefix}-error`}>
                {error}
              </Alert>,
            )}
          {!error &&
            loading &&
            rows.length === 0 &&
            message(
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress data-testid={`${testIdPrefix}-loading`} />
              </Box>,
            )}
          {!error &&
            !loading &&
            rows.length === 0 &&
            message(
              <Typography align="center" data-testid={`${testIdPrefix}-empty`}>
                {emptyText}
              </Typography>,
            )}
          {rows.map((row) => {
            const flashing = flashKey !== null && rowKey(row) === flashKey;
            return (
              <TableRow
                key={rowKey(row)}
                hover
                data-testid={rowTestId(row)}
                data-flash={flashing || undefined}
                ref={flashing ? scrollTo : undefined}
                onAnimationEnd={flashing ? onFlashEnd : undefined}
                sx={flashing ? flashSx : undefined}
              >
                {columns.map((column) => cell(column, row))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default DataTable;
