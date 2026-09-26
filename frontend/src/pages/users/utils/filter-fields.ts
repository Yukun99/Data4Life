import { FilterField, plainOptions } from '@/common/components/data-table/types';
import { formatMoney } from '@/common/utils/format';
import { UserFilter, UserFilterOptions } from '@/store/users-slice';

const money = (values: number[] = []) =>
  values.map((value) => ({ value: String(value), label: formatMoney(value) }));

const yesNo = (values: boolean[] = []) =>
  values.map((value) => ({ value: String(value), label: value ? 'Yes' : 'No' }));

/** The filter dialog fields for the users table, with options from the last list response. */
export const fieldsFor = (options: UserFilterOptions | null): FilterField<keyof UserFilter>[] => [
  { key: 'name', label: 'Name', testId: 'filter-name', options: plainOptions(options?.name) },
  { key: 'email', label: 'Email', testId: 'filter-email', options: plainOptions(options?.email) },
  { key: 'admin', label: 'Admin', testId: 'filter-admin', options: yesNo(options?.admin) },
  {
    key: 'totalBorrows',
    label: 'Total Borrows',
    testId: 'filter-total-borrows',
    options: plainOptions(options?.totalBorrows),
  },
  {
    key: 'currentBorrows',
    label: 'Current Borrows',
    testId: 'filter-current-borrows',
    options: plainOptions(options?.currentBorrows),
  },
  {
    key: 'totalFines',
    label: 'Total Fines',
    testId: 'filter-total-fines',
    options: money(options?.totalFines),
  },
  {
    key: 'currentFines',
    label: 'Current Fines',
    testId: 'filter-current-fines',
    options: money(options?.currentFines),
  },
];
