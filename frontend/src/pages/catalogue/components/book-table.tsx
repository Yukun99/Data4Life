import ColumnDivider from '@/pages/catalogue/components/column-divider';
import SortLabel from '@/pages/catalogue/components/sort-label';
import useColumnResize from '@/pages/catalogue/hooks/use-column-resize';
import { Book, COLUMN_ORDER, ColumnKey, Sort, SortKey } from '@/store/catalogue-slice';
import DeleteOutlined from '@mui/icons-material/DeleteOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

type BookTableProps = {
  books: Book[];
  sort: Sort;
  loading: boolean;
  error: string;
  onToggleSort: (key: SortKey) => void;
  onSwitchSort: (key: SortKey) => void;
  onEdit: (book: Book) => void;
  onDelete: (book: Book) => void;
};

const COLUMNS = COLUMN_ORDER.length;

const ellipsis = { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } as const;

const Line = ({ text, secondary = false }: { text: string; secondary?: boolean }) => (
  <Typography
    variant="body2"
    color={secondary ? 'text.secondary' : undefined}
    title={text}
    sx={ellipsis}
  >
    {text}
  </Typography>
);

const BookTable = ({
  books,
  sort,
  loading,
  error,
  onToggleSort,
  onSwitchSort,
  onEdit,
  onDelete,
}: BookTableProps) => {
  const { widths, startResize } = useColumnResize();
  const stacked = (key: SortKey) => (!sort || sort.key === key ? onToggleSort : onSwitchSort);
  const single = (label: string, key: SortKey) => (
    <SortLabel label={label} sortKey={key} sort={sort} onClick={onToggleSort} />
  );
  const pair = (top: [string, SortKey], bottom: [string, SortKey]) => (
    <Stack sx={{ alignItems: 'flex-start' }}>
      <SortLabel label={top[0]} sortKey={top[1]} sort={sort} onClick={stacked(top[1])} />
      <SortLabel label={bottom[0]} sortKey={bottom[1]} sort={sort} onClick={stacked(bottom[1])} />
    </Stack>
  );
  const header = (key: ColumnKey, content: React.ReactNode) => (
    <TableCell sx={{ position: 'relative', ...ellipsis }}>
      {content}
      <ColumnDivider columnKey={key} onPointerDown={startResize(key)} />
    </TableCell>
  );

  return (
    <TableContainer sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
      <Table stickyHeader size="small" sx={{ tableLayout: 'fixed', width: '100%' }}>
        <colgroup>
          {COLUMN_ORDER.map((key) => (
            <col key={key} style={{ width: `${widths[key]}%` }} data-testid={`col-${key}`} />
          ))}
        </colgroup>
        <TableHead>
          <TableRow>
            {header('isbn', single('ISBN', 'isbn'))}
            {header('titleAuthor', pair(['Title', 'title'], ['Author', 'author']))}
            {header('genreLanguage', pair(['Genre', 'genre'], ['Language', 'language']))}
            {header('amount', single('Amount', 'amount'))}
            {header('stock', single('Stock', 'stock'))}
            <TableCell sx={ellipsis}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {error && (
            <TableRow>
              <TableCell colSpan={COLUMNS}>
                <Alert severity="error" data-testid="catalogue-error">
                  {error}
                </Alert>
              </TableCell>
            </TableRow>
          )}
          {!error && loading && books.length === 0 && (
            <TableRow>
              <TableCell colSpan={COLUMNS}>
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <CircularProgress data-testid="catalogue-loading" />
                </Box>
              </TableCell>
            </TableRow>
          )}
          {!error && !loading && books.length === 0 && (
            <TableRow>
              <TableCell colSpan={COLUMNS}>
                <Typography align="center" data-testid="catalogue-empty">
                  No books found
                </Typography>
              </TableCell>
            </TableRow>
          )}
          {books.map((book) => (
            <TableRow key={book.isbn} hover data-testid={`book-row-${book.isbn}`}>
              <TableCell sx={ellipsis} title={book.isbn}>
                {book.isbn}
              </TableCell>
              <TableCell sx={ellipsis}>
                <Line text={book.title} />
                <Line text={book.author} secondary />
              </TableCell>
              <TableCell sx={ellipsis}>
                <Line text={book.genre.name} />
                <Line text={book.language.name} secondary />
              </TableCell>
              <TableCell sx={ellipsis}>{book.amount}</TableCell>
              <TableCell sx={ellipsis}>{book.stock}</TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>
                <IconButton
                  aria-label={`Edit ${book.title}`}
                  onClick={() => onEdit(book)}
                  data-testid={`book-edit-${book.isbn}`}
                >
                  <EditOutlined />
                </IconButton>
                <IconButton
                  aria-label={`Delete ${book.title}`}
                  onClick={() => onDelete(book)}
                  data-testid={`book-delete-${book.isbn}`}
                >
                  <DeleteOutlined />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default BookTable;
