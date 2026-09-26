import { Book } from '@/store/catalogue-slice';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Typography from '@mui/material/Typography';

type DeleteDialogProps = {
  target: Book | null;
  error: string;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

const DeleteDialog = ({ target, error, deleting, onCancel, onConfirm }: DeleteDialogProps) => (
  <Dialog open={!!target} onClose={onCancel} fullWidth maxWidth="xs" data-testid="delete-dialog">
    <DialogTitle>Delete {target?.title}?</DialogTitle>
    <DialogContent>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} data-testid="delete-error">
          {error}
        </Alert>
      )}
      <Typography>This removes ISBN {target?.isbn} from the catalogue.</Typography>
    </DialogContent>
    <DialogActions>
      <Button onClick={onCancel} data-testid="delete-cancel">
        Cancel
      </Button>
      <Button
        variant="contained"
        color="error"
        onClick={onConfirm}
        loading={deleting}
        data-testid="delete-confirm"
      >
        Delete
      </Button>
    </DialogActions>
  </Dialog>
);

export default DeleteDialog;
