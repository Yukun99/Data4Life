import { Loan } from '@/common/types';
import { chipColor, formatDays, formatMoney, statusLabel } from '@/common/utils/format';
import { AdminUser } from '@/store/users-slice';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Fragment } from 'react';

type FinesDialogProps = {
  target: AdminUser | null;
  fines: Loan[];
  loading: boolean;
  error: string;
  forgivingId: number | null;
  onForgive: (loan: Loan) => void;
  onClose: () => void;
};

const FinesDialog = ({
  target,
  fines,
  loading,
  error,
  forgivingId,
  onForgive,
  onClose,
}: FinesDialogProps) => (
  <Dialog open={!!target} onClose={onClose} fullWidth maxWidth="sm" data-testid="fines-dialog">
    <DialogTitle>Fines for {target?.name}</DialogTitle>
    <DialogContent>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} data-testid="fines-error">
          {error}
        </Alert>
      )}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress data-testid="fines-loading" />
        </Box>
      )}
      {!loading && !error && fines.length === 0 && (
        <Typography variant="body2" data-testid="fines-empty">
          No fines
        </Typography>
      )}
      <List disablePadding>
        {fines.map((loan, index) => (
          <Fragment key={loan.id}>
            {index > 0 && <Divider component="li" />}
            <ListItem disableGutters data-testid={`fines-row-${loan.id}`}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1}
                sx={{ width: '100%', justifyContent: 'space-between' }}
              >
                <Stack>
                  <Typography sx={{ fontWeight: 500 }}>{loan.title}</Typography>
                  <Typography variant="body2">{loan.author}</Typography>
                </Stack>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexShrink: 0 }}>
                  <Chip
                    label={statusLabel[loan.status]}
                    color={chipColor[loan.status]}
                    size="small"
                    data-testid={`fines-status-${loan.id}`}
                  />
                  <Typography variant="body2" data-testid={`fines-detail-${loan.id}`}>
                    {formatDays(loan.overdueDays)} late · {formatMoney(loan.fine)}
                  </Typography>
                  {loan.status === 'UNPAID' && (
                    <Button
                      size="small"
                      variant="contained"
                      loading={forgivingId === loan.id}
                      onClick={() => onForgive(loan)}
                      data-testid={`fines-forgive-${loan.id}`}
                    >
                      Forgive
                    </Button>
                  )}
                </Stack>
              </Stack>
            </ListItem>
          </Fragment>
        ))}
      </List>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} data-testid="fines-close">
        Close
      </Button>
    </DialogActions>
  </Dialog>
);

export default FinesDialog;
