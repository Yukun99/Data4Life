import FilterDialog from '@/common/components/data-table/filter-dialog';
import TablePagination from '@/common/components/data-table/table-pagination';
import TableToolbar from '@/common/components/data-table/table-toolbar';
import { PAGE_SIZES } from '@/common/components/data-table/types';
import BookDialog from '@/pages/catalogue/components/book-dialog';
import BookTable from '@/pages/catalogue/components/book-table';
import DeleteDialog from '@/pages/catalogue/components/delete-dialog';
import MergeDialog from '@/pages/catalogue/components/merge-dialog';
import useBookDialog from '@/pages/catalogue/hooks/use-book-dialog';
import useBooks from '@/pages/catalogue/hooks/use-books';
import useDeleteBook from '@/pages/catalogue/hooks/use-delete-book';
import useMergeDialog from '@/pages/catalogue/hooks/use-merge-dialog';
import { fieldsFor } from '@/pages/catalogue/utils/filter-fields';
import { EMPTY_FILTER, FILTER_KEYS } from '@/store/catalogue-slice';
import Add from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { useState } from 'react';

const CataloguePage = () => {
  const books = useBooks();
  const merge = useMergeDialog({ onMerged: books.reload });
  const dialog = useBookDialog({ onSaved: books.reload, onConflict: merge.start });
  const remove = useDeleteBook({ onDeleted: books.reload });
  const [filtering, setFiltering] = useState(false);
  const genres = books.filters?.genre ?? [];
  const languages = books.filters?.language ?? [];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, p: 2, gap: 2 }}>
      <TableToolbar
        size={books.size}
        sizes={PAGE_SIZES}
        activeFilters={FILTER_KEYS.filter((key) => books.filter[key] !== '').length}
        onFilter={() => setFiltering(true)}
        onSizeChange={books.setSize}
        testIdPrefix="catalogue"
        actions={
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => dialog.openDialog()}
            data-testid="catalogue-add"
          >
            Add
          </Button>
        }
      />
      <BookTable
        books={books.books}
        sort={books.sort}
        loading={books.loading}
        error={books.error}
        onToggleSort={books.toggleSort}
        onSwitchSort={books.switchSort}
        onEdit={dialog.openDialog}
        onDelete={remove.open}
      />
      <TablePagination
        page={books.page}
        totalPages={books.totalPages}
        onGoTo={books.goTo}
        testIdPrefix="catalogue"
      />
      {filtering && (
        <FilterDialog
          title="Filter books"
          fields={fieldsFor(books.filters)}
          filter={books.filter}
          empty={EMPTY_FILTER}
          onApply={(filter) => {
            books.applyFilter(filter);
            setFiltering(false);
          }}
          onCancel={() => setFiltering(false)}
        />
      )}
      <BookDialog
        open={dialog.open}
        editing={dialog.editing}
        fields={dialog.fields}
        errors={dialog.errors}
        genres={genres}
        languages={languages}
        onLoan={dialog.onLoan}
        error={dialog.error}
        saving={dialog.saving}
        onFieldChange={dialog.setField}
        onCancel={dialog.close}
        onSave={dialog.submit}
      />
      <MergeDialog
        conflict={merge.conflict}
        differing={merge.differing}
        choices={merge.choices}
        onChoose={merge.choose}
        custom={merge.custom}
        onCustomChange={merge.setCustom}
        amount={merge.amount}
        onAmountChange={merge.setAmount}
        stockAfter={merge.stockAfter}
        genres={genres}
        languages={languages}
        error={merge.error}
        saving={merge.saving}
        onCancel={merge.cancel}
        onConfirm={merge.confirm}
      />
      <DeleteDialog
        target={remove.target}
        error={remove.error}
        deleting={remove.deleting}
        onCancel={remove.cancel}
        onConfirm={remove.confirm}
      />
    </Box>
  );
};

export default CataloguePage;
