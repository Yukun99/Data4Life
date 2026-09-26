import { NamedItem } from '@/common/types';
import NamedSelect from '@/pages/catalogue/components/named-select';
import { BookErrors, BookFields } from '@/pages/catalogue/types';
import { Book } from '@/store/catalogue-slice';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

type TextKey = 'isbn' | 'title' | 'author' | 'amount';

type BookDialogProps = {
  open: boolean;
  editing: Book | null;
  fields: BookFields;
  errors: BookErrors;
  genres: NamedItem[];
  languages: NamedItem[];
  onLoan: number;
  error: string;
  saving: boolean;
  onFieldChange: <K extends keyof BookFields>(key: K, value: BookFields[K]) => void;
  onCancel: () => void;
  onSave: () => void;
};

const TEXT_FIELDS: { key: TextKey; label: string; maxLength: number }[] = [
  { key: 'isbn', label: 'ISBN', maxLength: 20 },
  { key: 'title', label: 'Title', maxLength: 255 },
  { key: 'author', label: 'Author', maxLength: 255 },
];

const BookDialog = ({
  open,
  editing,
  fields,
  errors,
  genres,
  languages,
  onLoan,
  error,
  saving,
  onFieldChange,
  onCancel,
  onSave,
}: BookDialogProps) => (
  <Dialog open={open} onClose={onCancel} fullWidth maxWidth="xs" data-testid="book-dialog">
    <DialogTitle>{editing ? 'Edit book' : 'Add book'}</DialogTitle>
    <DialogContent>
      <Stack spacing={2} sx={{ pt: 1 }}>
        {error && (
          <Alert severity="error" data-testid="book-error">
            {error}
          </Alert>
        )}
        {TEXT_FIELDS.map(({ key, label, maxLength }) => (
          <TextField
            key={key}
            label={label}
            required
            value={fields[key]}
            onChange={(event) => onFieldChange(key, event.target.value)}
            error={!!errors[key]}
            helperText={errors[key]}
            slotProps={{ htmlInput: { maxLength, 'data-testid': `book-${key}-input` } }}
          />
        ))}
        <NamedSelect
          label="Genre"
          testId="book-genre"
          options={genres}
          value={fields.genre}
          onChange={(value) => onFieldChange('genre', value)}
          error={errors.genre}
        />
        <NamedSelect
          label="Language"
          testId="book-language"
          options={languages}
          value={fields.language}
          onChange={(value) => onFieldChange('language', value)}
          error={errors.language}
        />
        <TextField
          label="Amount"
          required
          value={fields.amount}
          onChange={(event) => onFieldChange('amount', event.target.value)}
          error={!!errors.amount}
          helperText={errors.amount}
          slotProps={{ htmlInput: { inputMode: 'numeric', 'data-testid': 'book-amount-input' } }}
        />
        {editing && (
          <Typography variant="body2" color="text.secondary" data-testid="book-stock">
            Stock: {editing.stock} ({onLoan} on loan)
          </Typography>
        )}
      </Stack>
    </DialogContent>
    <DialogActions>
      <Button onClick={onCancel} data-testid="book-cancel">
        Cancel
      </Button>
      <Button variant="contained" onClick={onSave} loading={saving} data-testid="book-save">
        Save
      </Button>
    </DialogActions>
  </Dialog>
);

export default BookDialog;
