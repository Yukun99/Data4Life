import { UserAction } from '@/pages/users/hooks/use-user-action';
import { AdminUser } from '@/store/users-slice';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Typography from '@mui/material/Typography';

type ActionDialogProps = {
  target: AdminUser | null;
  action: UserAction;
  error: string;
  saving: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

const title = (action: UserAction, name = '') => {
  switch (action) {
    case 'promote':
      return `Promote ${name} to admin?`;
    case 'demote':
      return `Remove admin from ${name}?`;
    case 'delete':
      return `Delete ${name}?`;
  }
};

const body = (action: UserAction, email = '') =>
  action === 'delete'
    ? `This removes ${email}, their borrowing history and interests.`
    : `${email} will have to log in again.`;

const labels: Record<UserAction, string> = { promote: 'Promote', demote: 'Demote', delete: 'Delete' };

const ActionDialog = ({ target, action, error, saving, onCancel, onConfirm }: ActionDialogProps) => (
  <Dialog open={!!target} onClose={onCancel} fullWidth maxWidth="xs" data-testid="action-dialog">
    <DialogTitle>{title(action, target?.name)}</DialogTitle>
    <DialogContent>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} data-testid="action-error">
          {error}
        </Alert>
      )}
      <Typography>{body(action, target?.email)}</Typography>
    </DialogContent>
    <DialogActions>
      <Button onClick={onCancel} data-testid="action-cancel">
        Cancel
      </Button>
      <Button
        variant="contained"
        color={action === 'promote' ? 'primary' : 'error'}
        onClick={onConfirm}
        loading={saving}
        data-testid="action-confirm"
      >
        {labels[action]}
      </Button>
    </DialogActions>
  </Dialog>
);

export default ActionDialog;
