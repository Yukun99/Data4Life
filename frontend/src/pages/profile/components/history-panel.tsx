import LoanRow from '@/pages/profile/components/loan-row';
import useHistory from '@/pages/profile/hooks/use-history';
import { formatMoney } from '@/common/utils/format';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Fragment } from 'react';

const HistoryPanel = () => {
  const { history, loading, error, payingId, payingAll, pay, payAll } = useHistory();
  const stats = history?.stats;

  const statItems = stats
    ? [
        { label: 'Books Borrowed', value: String(stats.booksBorrowed), testId: 'borrowed' },
        { label: 'Favourite Genre', value: stats.favouriteGenre ?? '–', testId: 'genre' },
        { label: 'Favourite Author', value: stats.favouriteAuthor ?? '–', testId: 'author' },
        {
          label: 'Total Overdue Fines',
          value: formatMoney(stats.totalOverdueFines),
          testId: 'fines',
        },
      ]
    : [];

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Typography variant="h6" component="h2" gutterBottom>
        History
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} data-testid="history-error">
          {error}
        </Alert>
      )}
      {loading && <CircularProgress data-testid="history-loading" />}
      {history && (
        <>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ alignItems: { sm: 'center' } }}
          >
            <Box
              sx={{
                flexGrow: 1,
                display: 'grid',
                gridTemplateColumns: { xs: '1fr 1fr', lg: 'repeat(4, 1fr)' },
                gap: 2,
              }}
            >
              {statItems.map(({ label, value, testId }) => (
                <Box key={testId}>
                  <Typography variant="caption">{label}</Typography>
                  <Typography data-testid={`history-stat-${testId}`}>{value}</Typography>
                </Box>
              ))}
            </Box>
            <Button
              variant="contained"
              disabled={history.stats.totalOverdueFines <= 0}
              loading={payingAll}
              onClick={payAll}
              data-testid="history-pay-all"
            >
              Pay all
            </Button>
          </Stack>
          <Divider sx={{ my: 2 }} />
          {history.loans.length === 0 ? (
            <Typography variant="body2" data-testid="history-empty">
              No borrows yet
            </Typography>
          ) : (
            <List disablePadding>
              {history.loans.map((loan, index) => (
                <Fragment key={loan.id}>
                  {index > 0 && <Divider component="li" />}
                  <LoanRow loan={loan} paying={payingId === loan.id} onPay={pay} />
                </Fragment>
              ))}
            </List>
          )}
        </>
      )}
    </Paper>
  );
};

export default HistoryPanel;
