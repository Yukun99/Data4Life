import { NamedItem } from '@/common/types';
import NamedSelect from '@/pages/catalogue/components/named-select';
import {
  Choice,
  CustomValues,
  MergeField,
  MergeValue,
  sideValue,
} from '@/pages/catalogue/hooks/use-merge-dialog';
import { Conflict } from '@/pages/catalogue/types';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

type MergeDialogProps = {
  conflict: Conflict | null;
  differing: MergeField[];
  choices: Record<MergeField, Choice>;
  onChoose: (field: MergeField, choice: Choice) => void;
  custom: CustomValues;
  onCustomChange: <K extends MergeField>(field: K, value: CustomValues[K]) => void;
  amount: string;
  onAmountChange: (amount: string) => void;
  stockAfter: number | null;
  genres: NamedItem[];
  languages: NamedItem[];
  error: string;
  saving: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

const LABELS: Record<MergeField, string> = {
  title: 'Title',
  author: 'Author',
  genre: 'Genre',
  language: 'Language',
};

const show = (value: MergeValue) => (typeof value === 'string' ? value.trim() : value?.name);

const radio = (field: MergeField, choice: Choice) => (
  <Radio slotProps={{ input: { 'data-testid': `merge-${field}-${choice}` } as object }} />
);

const MergeDialog = ({
  conflict,
  differing,
  choices,
  onChoose,
  custom,
  onCustomChange,
  amount,
  onAmountChange,
  stockAfter,
  genres,
  languages,
  error,
  saving,
  onCancel,
  onConfirm,
}: MergeDialogProps) => {
  const customInput = (field: MergeField) => {
    const testId = `merge-${field}-input`;
    if (field === 'genre' || field === 'language') {
      return (
        <NamedSelect
          label={`Custom ${LABELS[field].toLowerCase()}`}
          testId={testId}
          options={field === 'genre' ? genres : languages}
          value={custom[field]}
          onChange={(value) => onCustomChange(field, value)}
        />
      );
    }
    return (
      <TextField
        size="small"
        label={`Custom ${LABELS[field].toLowerCase()}`}
        value={custom[field]}
        onChange={(event) => onCustomChange(field, event.target.value)}
        slotProps={{ htmlInput: { maxLength: 255, 'data-testid': testId } }}
      />
    );
  };

  return (
    <Dialog open={!!conflict} onClose={onCancel} fullWidth maxWidth="sm" data-testid="merge-dialog">
      <DialogTitle>Merge books</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Typography data-testid="merge-message">
            ISBN {conflict?.target.isbn} already exists. Choose values for the merged book.
          </Typography>
          {error && (
            <Alert severity="error" data-testid="merge-error">
              {error}
            </Alert>
          )}
          {conflict &&
            differing.map((field) => (
              <FormControl key={field} data-testid={`merge-${field}`}>
                <FormLabel>{LABELS[field]}</FormLabel>
                <RadioGroup
                  value={choices[field]}
                  onChange={(_, value) => onChoose(field, value as Choice)}
                >
                  <FormControlLabel
                    value="source"
                    control={radio(field, 'source')}
                    label={`Edited: ${show(sideValue(conflict, 'source', field))}`}
                  />
                  <FormControlLabel
                    value="target"
                    control={radio(field, 'target')}
                    label={`Existing: ${show(sideValue(conflict, 'target', field))}`}
                  />
                  <FormControlLabel value="custom" control={radio(field, 'custom')} label="Custom" />
                </RadioGroup>
                {choices[field] === 'custom' && customInput(field)}
              </FormControl>
            ))}
          <TextField
            label="Amount"
            required
            value={amount}
            onChange={(event) => onAmountChange(event.target.value)}
            slotProps={{ htmlInput: { inputMode: 'numeric', 'data-testid': 'merge-amount-input' } }}
          />
          <Typography variant="body2" color="text.secondary" data-testid="merge-stock">
            Stock after merge: {stockAfter ?? '-'}
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} data-testid="merge-cancel">
          Cancel
        </Button>
        <Button variant="contained" onClick={onConfirm} loading={saving} data-testid="merge-confirm">
          Merge
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MergeDialog;
