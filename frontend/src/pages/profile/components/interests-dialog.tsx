import InterestPicker from '@/pages/profile/components/interest-picker';
import { InterestOptions, MAX_INTERESTS, NamedItem } from '@/pages/profile/hooks/use-interests';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

type InterestsDialogProps = {
  open: boolean;
  firstTime: boolean;
  options: InterestOptions;
  genres: NamedItem[];
  onGenresChange: (genres: NamedItem[]) => void;
  languages: NamedItem[];
  onLanguagesChange: (languages: NamedItem[]) => void;
  total: number;
  error: string;
  saving: boolean;
  onClose: () => void;
  onSkip: () => void;
  onConfirm: () => void;
};

const InterestsDialog = ({
  open,
  firstTime,
  options,
  genres,
  onGenresChange,
  languages,
  onLanguagesChange,
  total,
  error,
  saving,
  onClose,
  onSkip,
  onConfirm,
}: InterestsDialogProps) => (
  <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" data-testid="interests-dialog">
    <DialogTitle>{firstTime ? 'What do you like to read?' : 'Edit interests'}</DialogTitle>
    <DialogContent>
      <Stack spacing={2} sx={{ pt: 1 }}>
        {error && (
          <Alert severity="error" data-testid="interests-error">
            {error}
          </Alert>
        )}
        <Typography variant="body2">
          Pick up to {MAX_INTERESTS} genres and languages in total.
        </Typography>
        <InterestPicker
          label="Genres"
          testId="interests-genres"
          options={options.genres}
          value={genres}
          onChange={onGenresChange}
          full={total >= MAX_INTERESTS}
        />
        <InterestPicker
          label="Languages"
          testId="interests-languages"
          options={options.languages}
          value={languages}
          onChange={onLanguagesChange}
          full={total >= MAX_INTERESTS}
        />
        <Typography variant="caption" data-testid="interests-count">
          {total} / {MAX_INTERESTS}
        </Typography>
      </Stack>
    </DialogContent>
    <DialogActions>
      {firstTime && (
        <Button onClick={onSkip} disabled={saving} data-testid="interests-skip">
          Skip
        </Button>
      )}
      <Box sx={{ flexGrow: 1 }} />
      <Button variant="contained" onClick={onConfirm} loading={saving} data-testid="interests-confirm">
        Confirm
      </Button>
    </DialogActions>
  </Dialog>
);

export default InterestsDialog;
