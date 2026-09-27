import ConfirmDialog from '@/common/components/confirm-dialog';
import FilterDialog from '@/common/components/data-table/filter-dialog';
import TablePagination from '@/common/components/data-table/table-pagination';
import TableToolbar from '@/common/components/data-table/table-toolbar';
import { PAGE_SIZES } from '@/common/components/data-table/types';
import ReturnTable from '@/pages/return/components/return-table';
import useReturnAction from '@/pages/return/hooks/use-return-action';
import useReturnLoans from '@/pages/return/hooks/use-return-loans';
import { fieldsFor } from '@/pages/return/utils/filter-fields';
import { EMPTY_RETURN_FILTER, RETURN_FILTER_KEYS } from '@/store/return-slice';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { useState } from 'react';

const ReturnPage = () => {
  const loans = useReturnLoans();
  const action = useReturnAction({ onDone: loans.reload });
  const [filtering, setFiltering] = useState(false);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, p: 2, gap: 2 }}>
      <TableToolbar
        size={loans.size}
        sizes={PAGE_SIZES}
        activeFilters={RETURN_FILTER_KEYS.filter((key) => loans.filter[key] !== '').length}
        onFilter={() => setFiltering(true)}
        onSizeChange={loans.setSize}
        testIdPrefix="return"
        actions={
          <Button
            variant="contained"
            disabled={loans.totalUnpaid <= 0}
            onClick={() => action.open(null, 'payAll')}
            data-testid="return-pay-all"
          >
            Pay all
          </Button>
        }
      />
      <ReturnTable
        loans={loans.loans}
        sort={loans.sort}
        loading={loans.loading}
        error={loans.error}
        onToggleSort={loans.toggleSort}
        onSwitchSort={loans.switchSort}
        onAction={action.open}
      />
      <TablePagination
        page={loans.page}
        totalPages={loans.totalPages}
        onGoTo={loans.goTo}
        testIdPrefix="return"
      />
      {filtering && (
        <FilterDialog
          title="Filter loans"
          fields={fieldsFor(loans.filters)}
          filter={loans.filter}
          empty={EMPTY_RETURN_FILTER}
          onApply={(filter) => {
            loans.applyFilter(filter);
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
        testIdPrefix="return-confirm"
      />
    </Box>
  );
};

export default ReturnPage;
