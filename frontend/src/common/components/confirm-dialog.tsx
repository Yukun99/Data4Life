import Alert from '@mui/material/Alert';
import Button, { ButtonProps } from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Typography from '@mui/material/Typography';
import { ReactNode } from 'react';

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  body: ReactNode;
  confirmLabel: string;
  color?: ButtonProps['color'];
  error: string;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  testIdPrefix: string;
};

const ConfirmDialog = ({
  open,
  title,
  body,
  confirmLabel,
  color = 'primary',
  error,
  loading,
  onCancel,
  onConfirm,
  testIdPrefix,
}: ConfirmDialogProps) => (
  <Dialog open={open} onClose={onCancel} fullWidth maxWidth="xs" data-testid={`${testIdPrefix}-dialog`}>
    <DialogTitle>{title}</DialogTitle>
    <DialogContent>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} data-testid={`${testIdPrefix}-error`}>
          {error}
        </Alert>
      )}
      <Typography>{body}</Typography>
    </DialogContent>
    <DialogActions>
      <Button onClick={onCancel} data-testid={`${testIdPrefix}-cancel`}>
        Cancel
      </Button>
      <Button
        variant="contained"
        color={color}
        onClick={onConfirm}
        loading={loading}
        data-testid={`${testIdPrefix}-confirm`}
      >
        {confirmLabel}
      </Button>
    </DialogActions>
  </Dialog>
);

export default ConfirmDialog;
