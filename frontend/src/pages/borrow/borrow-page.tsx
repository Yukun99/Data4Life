import ConfirmDialog from '@/common/components/confirm-dialog';
import FilterDialog from '@/common/components/data-table/filter-dialog';
import TablePagination from '@/common/components/data-table/table-pagination';
import TableToolbar from '@/common/components/data-table/table-toolbar';
import { PAGE_SIZES } from '@/common/components/data-table/types';
import BorrowTable from '@/pages/borrow/components/borrow-table';
import useBorrowAction from '@/pages/borrow/hooks/use-borrow-action';
import useBorrowBooks from '@/pages/borrow/hooks/use-borrow-books';
import { fieldsFor } from '@/pages/borrow/utils/filter-fields';
import { BORROW_FILTER_KEYS, EMPTY_BORROW_FILTER } from '@/store/borrow-slice';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import { useState } from 'react';

const BorrowPage = () => {
  const books = useBorrowBooks();
  const action = useBorrowAction({ onDone: books.reload });
  const [filtering, setFiltering] = useState(false);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, p: 2, gap: 2 }}>
      <TableToolbar
        size={books.size}
        sizes={PAGE_SIZES}
        activeFilters={BORROW_FILTER_KEYS.filter((key) => books.filter[key] !== '').length}
        onFilter={() => setFiltering(true)}
        onSizeChange={books.setSize}
        testIdPrefix="borrow"
      />
      {books.block && (
        <Alert severity="info" data-testid="borrow-block">
          {books.block}
        </Alert>
      )}
      <BorrowTable
        books={books.books}
        sort={books.sort}
        loading={books.loading}
        error={books.error}
        block={books.block}
        convertBlock={books.convertBlock}
        onToggleSort={books.toggleSort}
        onSwitchSort={books.switchSort}
        onAction={action.open}
      />
      <TablePagination
        page={books.page}
        totalPages={books.totalPages}
        onGoTo={books.goTo}
        testIdPrefix="borrow"
      />
      {filtering && (
        <FilterDialog
          title="Filter books"
          fields={fieldsFor(books.filters)}
          filter={books.filter}
          empty={EMPTY_BORROW_FILTER}
          onApply={(filter) => {
            books.applyFilter(filter);
            setFiltering(false);
          }}
          onCancel={() => setFiltering(false)}
        />
      )}
      <ConfirmDialog
        open={!!action.target}
        title={action.text.title}
        body={action.text.body}
        confirmLabel={action.text.confirmLabel}
        error={action.error}
        loading={action.saving}
        onCancel={action.cancel}
        onConfirm={action.confirm}
        testIdPrefix="borrow-confirm"
      />
    </Box>
  );
};

export default BorrowPage;
