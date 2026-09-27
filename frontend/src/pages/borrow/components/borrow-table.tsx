import DataTable from '@/common/components/data-table/data-table';
import { ColumnSpec } from '@/common/components/data-table/types';
import { queueText } from '@/common/utils/format';
import { BorrowAction } from '@/pages/borrow/hooks/use-borrow-action';
import useBorrowColumns from '@/pages/borrow/hooks/use-borrow-columns';
import {
  BorrowBook,
  BorrowColumnKey,
  BorrowSort,
  BorrowSortKey,
  Holding,
} from '@/store/borrow-slice';
import Button from '@mui/material/Button';
import Chip, { ChipProps } from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';

type BorrowTableProps = {
  books: BorrowBook[];
  sort: BorrowSort;
  loading: boolean;
  error: string;
  block: string | null;
  convertBlock: string | null;
  onToggleSort: (key: BorrowSortKey) => void;
  onSwitchSort: (key: BorrowSortKey) => void;
  onAction: (book: BorrowBook, action: BorrowAction) => void;
  flashIsbn: string | null;
  onFlashEnd: () => void;
};

type ActionButtonProps = {
  book: BorrowBook;
  action: BorrowAction;
  reason: string;
  onAction: (book: BorrowBook, action: BorrowAction) => void;
};

const ActionButton = ({ book, action, reason, onAction }: ActionButtonProps) => (
  <Tooltip title={reason}>
    <span>
      <Button
        size="small"
        variant={action === 'borrow' ? 'contained' : 'outlined'}
        disabled={reason !== ''}
        onClick={() => onAction(book, action)}
        data-testid={`borrow-${action}-${book.isbn}`}
      >
        {action === 'borrow' ? 'Borrow' : 'Reserve'}
      </Button>
    </span>
  </Tooltip>
);

const CHIP: Record<Holding, { label: string; color: ChipProps['color'] }> = {
  BORROWED: { label: 'Borrowed', color: 'primary' },
  RESERVED: { label: 'Reserved', color: 'secondary' },
  QUEUED: { label: 'Queued', color: 'info' },
};

const chipLabel = (holding: Holding, position: number | null) =>
  holding === 'QUEUED' && position !== null ? queueText(position) : CHIP[holding].label;

const BorrowTable = ({
  books,
  sort,
  loading,
  error,
  block,
  convertBlock,
  onToggleSort,
  onSwitchSort,
  onAction,
  flashIsbn,
  onFlashEnd,
}: BorrowTableProps) => {
  const { widths, onWidthsChange, onWidthsCommit } = useBorrowColumns();

  const actions = (book: BorrowBook) => {
    const chip = book.holding && (
      <Chip
        label={chipLabel(book.holding, book.queuePosition)}
        color={CHIP[book.holding].color}
        size="small"
        data-testid={`borrow-holding-${book.isbn}`}
      />
    );
    if (book.holding === 'BORROWED' || book.holding === 'QUEUED') {
      return chip;
    }
    const reserved = book.holding === 'RESERVED';
    const stockReason = book.stock === 0 ? 'Out of stock' : '';
    return (
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        {chip}
        <ActionButton
          book={book}
          action="borrow"
          reason={reserved ? (convertBlock ?? '') : (block ?? stockReason)}
          onAction={onAction}
        />
        {!reserved && (
          <ActionButton book={book} action="reserve" reason={block ?? ''} onAction={onAction} />
        )}
      </Stack>
    );
  };

  const columns: ColumnSpec<BorrowBook, BorrowColumnKey, BorrowSortKey>[] = [
    { key: 'isbn', headers: [{ label: 'ISBN', sortKey: 'isbn' }], lines: (book) => [book.isbn] },
    {
      key: 'titleAuthor',
      headers: [
        { label: 'Title', sortKey: 'title' },
        { label: 'Author', sortKey: 'author' },
      ],
      lines: (book) => [book.title, book.author],
    },
    {
      key: 'genreLanguage',
      headers: [
        { label: 'Genre', sortKey: 'genre' },
        { label: 'Language', sortKey: 'language' },
      ],
      lines: (book) => [book.genre.name, book.language.name],
    },
    {
      key: 'stock',
      headers: [{ label: 'Stock', sortKey: 'stock' }],
      lines: (book) => [String(book.stock)],
    },
    { key: 'actions', headers: [{ label: 'Actions' }], render: actions },
  ];

  return (
    <DataTable
      columns={columns}
      rows={books}
      rowKey={(book) => book.isbn}
      rowTestId={(book) => `borrow-row-${book.isbn}`}
      sort={sort}
      onToggleSort={onToggleSort}
      onSwitchSort={onSwitchSort}
      widths={widths}
      onWidthsChange={onWidthsChange}
      onWidthsCommit={onWidthsCommit}
      loading={loading}
      error={error}
      emptyText="No books found"
      testIdPrefix="borrow"
      flashKey={flashIsbn}
      onFlashEnd={onFlashEnd}
    />
  );
};

export default BorrowTable;
