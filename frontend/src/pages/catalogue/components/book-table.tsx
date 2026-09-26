import DataTable from '@/common/components/data-table/data-table';
import { ColumnSpec } from '@/common/components/data-table/types';
import useCatalogueColumns from '@/pages/catalogue/hooks/use-catalogue-columns';
import { Book, ColumnKey, Sort, SortKey } from '@/store/catalogue-slice';
import DeleteOutlined from '@mui/icons-material/DeleteOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import IconButton from '@mui/material/IconButton';

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
  const { widths, onWidthsChange, onWidthsCommit } = useCatalogueColumns();

  const columns: ColumnSpec<Book, ColumnKey, SortKey>[] = [
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
      key: 'amount',
      headers: [{ label: 'Amount', sortKey: 'amount' }],
      lines: (book) => [String(book.amount)],
    },
    {
      key: 'stock',
      headers: [{ label: 'Stock', sortKey: 'stock' }],
      lines: (book) => [String(book.stock)],
    },
    {
      key: 'actions',
      headers: [{ label: 'Actions' }],
      render: (book) => (
        <>
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
        </>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={books}
      rowKey={(book) => book.isbn}
      rowTestId={(book) => `book-row-${book.isbn}`}
      sort={sort}
      onToggleSort={onToggleSort}
      onSwitchSort={onSwitchSort}
      widths={widths}
      onWidthsChange={onWidthsChange}
      onWidthsCommit={onWidthsCommit}
      loading={loading}
      error={error}
      emptyText="No books found"
      testIdPrefix="catalogue"
    />
  );
};

export default BookTable;
