import ConfirmDialog from '@/common/components/confirm-dialog';
import FilterDialog from '@/common/components/data-table/filter-dialog';
import TablePagination from '@/common/components/data-table/table-pagination';
import TableToolbar from '@/common/components/data-table/table-toolbar';
import { PAGE_SIZES } from '@/common/components/data-table/types';
import { formatMoney } from '@/common/utils/format';
import ActionDialog from '@/pages/users/components/action-dialog';
import FinesDialog from '@/pages/users/components/fines-dialog';
import UserTable from '@/pages/users/components/user-table';
import useFinesDialog from '@/pages/users/hooks/use-fines-dialog';
import useUserAction from '@/pages/users/hooks/use-user-action';
import useUsers from '@/pages/users/hooks/use-users';
import { fieldsFor } from '@/pages/users/utils/filter-fields';
import { EMPTY_USER_FILTER, USER_FILTER_KEYS } from '@/store/users-slice';
import Box from '@mui/material/Box';
import { useState } from 'react';

const UsersPage = () => {
  const users = useUsers();
  const action = useUserAction({ onChanged: users.reload });
  const fines = useFinesDialog({ onForgiven: users.reload });
  const [filtering, setFiltering] = useState(false);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, p: 2, gap: 2 }}>
      <TableToolbar
        size={users.size}
        sizes={PAGE_SIZES}
        activeFilters={USER_FILTER_KEYS.filter((key) => users.filter[key] !== '').length}
        onFilter={() => setFiltering(true)}
        onSizeChange={users.setSize}
        testIdPrefix="users"
      />
      <UserTable
        users={users.users}
        sort={users.sort}
        loading={users.loading}
        error={users.error}
        widths={users.columnWidths}
        onToggleSort={users.toggleSort}
        onSwitchSort={users.switchSort}
        onWidthsChange={users.setWidths}
        onWidthsCommit={users.saveWidths}
        onPromote={(user) => action.open(user, 'promote')}
        onDemote={(user) => action.open(user, 'demote')}
        onDelete={(user) => action.open(user, 'delete')}
        onFines={fines.open}
      />
      <TablePagination
        page={users.page}
        totalPages={users.totalPages}
        onGoTo={users.goTo}
        testIdPrefix="users"
      />
      {filtering && (
        <FilterDialog
          title="Filter users"
          fields={fieldsFor(users.filters)}
          filter={users.filter}
          empty={EMPTY_USER_FILTER}
          onApply={(filter) => {
            users.applyFilter(filter);
            setFiltering(false);
          }}
          onCancel={() => setFiltering(false)}
        />
      )}
      <ActionDialog
        target={action.target}
        action={action.action}
        error={action.error}
        saving={action.saving}
        onCancel={action.cancel}
        onConfirm={action.confirm}
      />
      <FinesDialog
        target={fines.target}
        fines={fines.fines}
        loading={fines.loading}
        error={fines.error}
        forgivingId={fines.forgivingId}
        onForgive={fines.askForgive}
        onClose={fines.close}
      />
      <ConfirmDialog
        open={!!fines.confirming}
        title={`Forgive ${formatMoney(fines.confirming?.fine ?? 0)} fine for ${fines.confirming?.title}?`}
        body={`${fines.target?.name} will no longer owe this fine.`}
        confirmLabel="Forgive"
        color="warning"
        error={fines.error}
        loading={fines.forgivingId !== null}
        onCancel={fines.cancelForgive}
        onConfirm={fines.confirmForgive}
        testIdPrefix="forgive"
      />
    </Box>
  );
};

export default UsersPage;
