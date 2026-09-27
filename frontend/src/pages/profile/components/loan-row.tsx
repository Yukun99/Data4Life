import {
  chipColor,
  daysUntil,
  formatDate,
  formatDays,
  formatMoney,
  statusLabel,
} from '@/common/utils/format';
import { Loan } from '@/store/history-slice';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import ListItem from '@mui/material/ListItem';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

type LoanRowProps = {
  loan: Loan;
  paying: boolean;
  onPay: (loan: Loan) => void;
};

const dueText = (dueAt: string) => {
  const left = daysUntil(dueAt);
  return left > 0 ? `Due in ${formatDays(left)}` : 'Due today';
};

const detail = ({ status, dueAt, reservedUntil, overdueDays, fine, fee }: Loan) => {
  switch (status) {
    case 'BORROWED':
      return dueAt ? dueText(dueAt) : '';
    case 'OVERDUE':
      return `${formatDays(overdueDays)} overdue · ${formatMoney(fine)} so far`;
    case 'UNPAID':
      return `${formatDays(overdueDays)} late · ${formatMoney(fine)}`;
    case 'PAID':
      return `${formatMoney(fine)} paid`;
    case 'FORGIVEN':
      return `${formatDays(overdueDays)} late · ${formatMoney(fine)} forgiven`;
    case 'RESERVED':
      return `Reserved until ${formatDate(reservedUntil ?? '')} · ${formatMoney(fee)} fee paid`;
    case 'EXPIRED':
      return reservedUntil
        ? `Reservation expired · ${formatMoney(fee)} fee paid`
        : `Left the queue · ${formatMoney(fee)} fee paid`;
    case 'QUEUED':
      return `In queue · ${formatMoney(fee)} fee paid`;
    case 'REMOVED':
      return `Removed from queue · ${formatMoney(fee)} fee paid`;
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
        <Typography variant="caption">
          {loan.borrowedAt
            ? `Borrowed ${formatDate(loan.borrowedAt)}`
            : `Reserved ${formatDate(loan.reservedAt ?? '')}`}
        </Typography>
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
            onClick={() => onPay(loan)}
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
