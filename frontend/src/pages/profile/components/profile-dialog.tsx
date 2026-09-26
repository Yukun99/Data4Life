import { AVATAR_KEYS, AVATARS } from '@/pages/profile/utils/avatars';
import { Avatar } from '@/store/user-slice';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

type ProfileDialogProps = {
  open: boolean;
  name: string;
  onNameChange: (name: string) => void;
  nameError: string;
  avatar: Avatar;
  onAvatarChange: (avatar: Avatar) => void;
  error: string;
  saving: boolean;
  onCancel: () => void;
  onSave: () => void;
};

const ProfileDialog = ({
  open,
  name,
  onNameChange,
  nameError,
  avatar,
  onAvatarChange,
  error,
  saving,
  onCancel,
  onSave,
}: ProfileDialogProps) => (
  <Dialog open={open} onClose={onCancel} fullWidth maxWidth="xs" data-testid="profile-dialog">
    <DialogTitle>Edit profile</DialogTitle>
    <DialogContent>
      <Stack spacing={2} sx={{ pt: 1 }}>
        {error && (
          <Alert severity="error" data-testid="profile-error">
            {error}
          </Alert>
        )}
        <TextField
          label="Name"
          required
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          error={!!nameError}
          helperText={nameError}
          slotProps={{ htmlInput: { maxLength: 100, 'data-testid': 'profile-name-input' } }}
        />
        <Typography variant="subtitle2">Icon</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1 }}>
          {AVATAR_KEYS.map((key) => {
            const Icon = AVATARS[key];
            const selected = key === avatar;
            return (
              <IconButton
                key={key}
                aria-label={`Use the ${key.toLowerCase()} icon`}
                aria-pressed={selected}
                color={selected ? 'primary' : 'default'}
                onClick={() => onAvatarChange(key)}
                sx={{
                  border: 2,
                  borderColor: selected ? 'primary.main' : 'transparent',
                  borderRadius: 2,
                }}
                data-testid={`profile-avatar-${key}`}
              >
                <Icon fontSize="large" />
              </IconButton>
            );
          })}
        </Box>
      </Stack>
    </DialogContent>
    <DialogActions>
      <Button onClick={onCancel} data-testid="profile-cancel">
        Cancel
      </Button>
      <Button variant="contained" onClick={onSave} loading={saving} data-testid="profile-save">
        Save
      </Button>
    </DialogActions>
  </Dialog>
);

export default ProfileDialog;
