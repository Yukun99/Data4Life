import DataTable from '@/common/components/data-table/data-table';
import { ColumnSpec } from '@/common/components/data-table/types';
import { formatDate, formatMoney } from '@/common/utils/format';
import {
  AdminUser,
  UserColumnKey,
  UserColumnWidths,
  UserSort,
  UserSortKey,
} from '@/store/users-slice';
import DeleteOutlined from '@mui/icons-material/DeleteOutlined';
import PersonAddOutlined from '@mui/icons-material/PersonAddOutlined';
import PersonRemoveOutlined from '@mui/icons-material/PersonRemoveOutlined';
import ReceiptLongOutlined from '@mui/icons-material/ReceiptLongOutlined';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

type UserTableProps = {
  users: AdminUser[];
  sort: UserSort;
  loading: boolean;
  error: string;
  widths: UserColumnWidths;
  onToggleSort: (key: UserSortKey) => void;
  onSwitchSort: (key: UserSortKey) => void;
  onWidthsChange: (widths: UserColumnWidths) => void;
  onWidthsCommit: (widths: UserColumnWidths) => void;
  onPromote: (user: AdminUser) => void;
  onDemote: (user: AdminUser) => void;
  onDelete: (user: AdminUser) => void;
  onFines: (user: AdminUser) => void;
};

const UserTable = ({
  users,
  sort,
  loading,
  error,
  widths,
  onToggleSort,
  onSwitchSort,
  onWidthsChange,
  onWidthsCommit,
  onPromote,
  onDemote,
  onDelete,
  onFines,
}: UserTableProps) => {
  const roleButton = (user: AdminUser) =>
    user.admin ? (
      <Tooltip title={user.demotable ? '' : 'Only their promoter can demote'}>
        <span>
          <IconButton
            aria-label={`Remove admin from ${user.name}`}
            disabled={!user.demotable}
            onClick={() => onDemote(user)}
            data-testid={`user-demote-${user.id}`}
          >
            <PersonRemoveOutlined />
          </IconButton>
        </span>
      </Tooltip>
    ) : (
      <IconButton
        aria-label={`Promote ${user.name} to admin`}
        onClick={() => onPromote(user)}
        data-testid={`user-promote-${user.id}`}
      >
        <PersonAddOutlined />
      </IconButton>
    );

  const columns: ColumnSpec<AdminUser, UserColumnKey, UserSortKey>[] = [
    {
      key: 'nameEmail',
      headers: [
        { label: 'Name', sortKey: 'name' },
        { label: 'Email', sortKey: 'email' },
      ],
      lines: (user) => [user.name, user.email],
    },
    {
      key: 'admin',
      headers: [{ label: 'Admin', sortKey: 'admin' }],
      lines: (user) => [user.admin ? 'Yes' : 'No'],
    },
    {
      key: 'joined',
      headers: [{ label: 'Joined', sortKey: 'joined' }],
      lines: (user) => [formatDate(user.createdAt)],
    },
    {
      key: 'borrows',
      headers: [
        { label: 'Total Borrows', sortKey: 'totalBorrows' },
        { label: 'Current Borrows', sortKey: 'currentBorrows' },
      ],
      lines: (user) => [String(user.totalBorrows), String(user.currentBorrows)],
    },
    {
      key: 'fines',
      headers: [
        { label: 'Total Fines', sortKey: 'totalFines' },
        { label: 'Current Fines', sortKey: 'currentFines' },
      ],
      lines: (user) => [formatMoney(user.totalFines), formatMoney(user.currentFines)],
    },
    {
      key: 'actions',
      headers: [{ label: 'Actions' }],
      render: (user) => (
        <>
          {roleButton(user)}
          <IconButton
            aria-label={`Fines for ${user.name}`}
            disabled={user.currentFines === 0}
            onClick={() => onFines(user)}
            data-testid={`user-fines-${user.id}`}
          >
            <ReceiptLongOutlined />
          </IconButton>
          <Tooltip title={user.deletable ? '' : 'Only their promoter can delete'}>
            <span>
              <IconButton
                aria-label={`Delete ${user.name}`}
                disabled={!user.deletable}
                onClick={() => onDelete(user)}
                data-testid={`user-delete-${user.id}`}
              >
                <DeleteOutlined />
              </IconButton>
            </span>
          </Tooltip>
        </>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={users}
      rowKey={(user) => user.id}
      rowTestId={(user) => `user-row-${user.id}`}
      sort={sort}
      onToggleSort={onToggleSort}
      onSwitchSort={onSwitchSort}
      widths={widths}
      onWidthsChange={onWidthsChange}
      onWidthsCommit={onWidthsCommit}
      loading={loading}
      error={error}
      emptyText="No users found"
      testIdPrefix="users"
    />
  );
};

export default UserTable;
