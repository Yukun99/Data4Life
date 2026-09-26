import { Loan, LoanStatus } from '@/store/history-slice';
import { daysUntil, formatDate, formatMoney, statusLabel } from '@/pages/profile/utils/format';
import Button from '@mui/material/Button';
import Chip, { ChipProps } from '@mui/material/Chip';
import ListItem from '@mui/material/ListItem';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

type LoanRowProps = {
  loan: Loan;
  paying: boolean;
  onPay: (id: number) => void;
};

const chipColor: Record<LoanStatus, ChipProps['color']> = {
  BORROWED: 'primary',
  RETURNED: 'success',
  OVERDUE: 'error',
  UNPAID: 'warning',
  PAID: 'default',
};

const days = (count: number) => `${count} ${count === 1 ? 'day' : 'days'}`;

const dueText = (dueAt: string) => {
  const left = daysUntil(dueAt);
  return left > 0 ? `Due in ${days(left)}` : 'Due today';
};

const detail = ({ status, dueAt, overdueDays, fine }: Loan) => {
  switch (status) {
    case 'BORROWED':
      return dueText(dueAt);
    case 'OVERDUE':
      return `${days(overdueDays)} overdue · ${formatMoney(fine)} so far`;
    case 'UNPAID':
      return `${days(overdueDays)} late · ${formatMoney(fine)}`;
    case 'PAID':
      return `${formatMoney(fine)} paid`;
    case 'RETURNED':
      return '';
  }
};

const LoanRow = ({ loan, paying, onPay }: LoanRowProps) => (
  <ListItem disableGutters data-testid={`loan-row-${loan.id}`}>
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={1}
      sx={{ width: '100%', justifyContent: 'space-between' }}
    >
      <Stack>
        <Typography sx={{ fontWeight: 500 }} data-testid={`loan-title-${loan.id}`}>
          {loan.title}
        </Typography>
        <Typography variant="body2">{loan.author}</Typography>
        <Typography variant="caption">Borrowed {formatDate(loan.borrowedAt)}</Typography>
      </Stack>
      <Stack
        direction="row"
        spacing={1}
        sx={{ alignItems: 'center', flexShrink: 0 }}
        data-testid={`loan-detail-${loan.id}`}
      >
        <Chip
          label={statusLabel[loan.status]}
          color={chipColor[loan.status]}
          size="small"
          data-testid={`loan-status-${loan.id}`}
        />
        <Typography variant="body2">{detail(loan)}</Typography>
        {loan.status === 'UNPAID' && (
          <Button
            size="small"
            variant="contained"
            loading={paying}
            onClick={() => onPay(loan.id)}
            data-testid={`loan-pay-${loan.id}`}
          >
            Pay
          </Button>
        )}
      </Stack>
    </Stack>
  </ListItem>
);

export default LoanRow;
