import InterestsDialog from '@/pages/profile/components/interests-dialog';
import useInterests from '@/pages/profile/hooks/use-interests';
import EditIcon from '@mui/icons-material/Edit';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

const InterestsCard = () => {
  const interests = useInterests();
  const chips = [...(interests.interests?.genres ?? []), ...(interests.interests?.languages ?? [])];

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" component="h2">
          Interests
        </Typography>
        <IconButton aria-label="Edit interests" onClick={interests.edit} data-testid="interests-edit">
          <EditIcon />
        </IconButton>
      </Stack>
      <Stack spacing={1} sx={{ mt: 1 }}>
        {interests.error && !interests.open && (
          <Alert severity="error" data-testid="interests-error">
            {interests.error}
          </Alert>
        )}
        {chips.length > 0 ? (
          <Stack direction="row" useFlexGap sx={{ flexWrap: 'wrap', gap: 1 }}>
            {chips.map(({ name }) => (
              <Chip key={name} label={name} data-testid={`interests-chip-${name}`} />
            ))}
          </Stack>
        ) : (
          interests.interests && (
            <Typography variant="body2" data-testid="interests-empty">
              No interests yet
            </Typography>
          )
        )}
      </Stack>
      <InterestsDialog
        open={interests.open}
        firstTime={interests.firstTime}
        options={interests.options}
        genres={interests.genres}
        onGenresChange={interests.setGenres}
        languages={interests.languages}
        onLanguagesChange={interests.setLanguages}
        total={interests.total}
        error={interests.error}
        saving={interests.saving}
        onClose={interests.close}
        onSkip={interests.skip}
        onConfirm={interests.confirm}
      />
    </Paper>
  );
};

export default InterestsCard;
