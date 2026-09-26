import BookDialog from '@/pages/catalogue/components/book-dialog';
import BookTable from '@/pages/catalogue/components/book-table';
import CataloguePagination from '@/pages/catalogue/components/catalogue-pagination';
import CatalogueToolbar from '@/pages/catalogue/components/catalogue-toolbar';
import DeleteDialog from '@/pages/catalogue/components/delete-dialog';
import FilterDialog from '@/pages/catalogue/components/filter-dialog';
import MergeDialog from '@/pages/catalogue/components/merge-dialog';
import useBookDialog from '@/pages/catalogue/hooks/use-book-dialog';
import useBooks from '@/pages/catalogue/hooks/use-books';
import useDeleteBook from '@/pages/catalogue/hooks/use-delete-book';
import useMergeDialog from '@/pages/catalogue/hooks/use-merge-dialog';
import { FILTER_KEYS } from '@/store/catalogue-slice';
import Box from '@mui/material/Box';
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
      <CatalogueToolbar
        size={books.size}
        activeFilters={FILTER_KEYS.filter((key) => books.filter[key] !== '').length}
        onAdd={() => dialog.openDialog()}
        onFilter={() => setFiltering(true)}
        onSizeChange={books.setSize}
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
      <CataloguePagination page={books.page} totalPages={books.totalPages} onGoTo={books.goTo} />
      {filtering && (
        <FilterDialog
          filter={books.filter}
          options={books.filters}
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
