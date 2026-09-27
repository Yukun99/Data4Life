import DataTable from '@/common/components/data-table/data-table';
import { ColumnSpec } from '@/common/components/data-table/types';
import { chipColor, formatDate, formatDays, formatMoney, statusLabel } from '@/common/utils/format';
import { ReturnAction } from '@/pages/return/hooks/use-return-action';
import useReturnColumns from '@/pages/return/hooks/use-return-columns';
import { ReturnColumnKey, ReturnLoan, ReturnSort, ReturnSortKey } from '@/store/return-slice';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

type ReturnTableProps = {
  loans: ReturnLoan[];
  sort: ReturnSort;
  loading: boolean;
  error: string;
  onToggleSort: (key: ReturnSortKey) => void;
  onSwitchSort: (key: ReturnSortKey) => void;
  onAction: (loan: ReturnLoan, action: ReturnAction) => void;
};

type RowAction = Exclude<ReturnAction, 'payAll'>;

const ROW_ACTION: Record<ReturnLoan['status'], RowAction> = {
  BORROWED: 'return',
  OVERDUE: 'return',
  UNPAID: 'pay',
  RESERVED: 'unreserve',
};

const ACTION_LABEL: Record<RowAction, string> = {
  return: 'Return',
  pay: 'Pay fine',
  unreserve: 'Unreserve',
};

const detail = (loan: ReturnLoan) => {
  if (loan.status === 'RESERVED') {
    return `Reserved until ${formatDate(loan.reservedUntil ?? '')}`;
  }
  if (loan.status === 'BORROWED') {
    return `Due ${formatDate(loan.dueAt ?? '')}`;
  }
  const days = formatDays(loan.overdueDays);
  const fine = formatMoney(loan.fine);
  return loan.status === 'OVERDUE' ? `${days} overdue · ${fine} so far` : `${days} late · ${fine}`;
};

const ReturnTable = ({
  loans,
  sort,
  loading,
  error,
  onToggleSort,
  onSwitchSort,
  onAction,
}: ReturnTableProps) => {
  const { widths, onWidthsChange, onWidthsCommit } = useReturnColumns();

  const status = (loan: ReturnLoan) => (
    <Stack spacing={0.5} sx={{ alignItems: 'flex-start' }}>
      <Chip
        label={statusLabel[loan.status]}
        color={chipColor[loan.status]}
        size="small"
        data-testid={`return-status-${loan.id}`}
      />
      <Typography variant="body2" color="text.secondary">
        {detail(loan)}
      </Typography>
    </Stack>
  );

  const actions = (loan: ReturnLoan) => {
    const action = ROW_ACTION[loan.status];
    return (
      <Button
        size="small"
        variant={action === 'unreserve' ? 'outlined' : 'contained'}
        onClick={() => onAction(loan, action)}
        data-testid={`return-${action}-${loan.id}`}
      >
        {ACTION_LABEL[action]}
      </Button>
    );
  };

  const columns: ColumnSpec<ReturnLoan, ReturnColumnKey, ReturnSortKey>[] = [
    { key: 'isbn', headers: [{ label: 'ISBN', sortKey: 'isbn' }], lines: (loan) => [loan.isbn] },
    {
      key: 'titleAuthor',
      headers: [
        { label: 'Title', sortKey: 'title' },
        { label: 'Author', sortKey: 'author' },
      ],
      lines: (loan) => [loan.title, loan.author],
    },
    {
      key: 'genreLanguage',
      headers: [
        { label: 'Genre', sortKey: 'genre' },
        { label: 'Language', sortKey: 'language' },
      ],
      lines: (loan) => [loan.genre.name, loan.language.name],
    },
    { key: 'status', headers: [{ label: 'Status', sortKey: 'due' }], render: status },
    { key: 'actions', headers: [{ label: 'Actions' }], render: actions },
  ];

  return (
    <DataTable
      columns={columns}
      rows={loans}
      rowKey={(loan) => String(loan.id)}
      rowTestId={(loan) => `return-row-${loan.id}`}
      sort={sort}
      onToggleSort={onToggleSort}
      onSwitchSort={onSwitchSort}
      widths={widths}
      onWidthsChange={onWidthsChange}
      onWidthsCommit={onWidthsCommit}
      loading={loading}
      error={error}
      emptyText="No books to return"
      testIdPrefix="return"
    />
  );
};

export default ReturnTable;
