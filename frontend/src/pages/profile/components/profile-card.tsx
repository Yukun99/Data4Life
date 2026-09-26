import ProfileDialog from '@/pages/profile/components/profile-dialog';
import useProfileDialog from '@/pages/profile/hooks/use-profile-dialog';
import { AVATARS } from '@/pages/profile/utils/avatars';
import { formatDate } from '@/common/utils/format';
import { useAppDispatch } from '@/store/hooks';
import { logout, User } from '@/store/user-slice';
import EditIcon from '@mui/icons-material/Edit';
import LogoutIcon from '@mui/icons-material/Logout';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useNavigate } from 'react-router';

type ProfileCardProps = {
  user: User;
};

const ProfileCard = ({ user }: ProfileCardProps) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const dialog = useProfileDialog(user);
  const Icon = AVATARS[user.avatar];

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" component="h2">
          Profile
        </Typography>
        <IconButton aria-label="Edit profile" onClick={dialog.openDialog} data-testid="profile-edit">
          <EditIcon />
        </IconButton>
      </Stack>
      <Stack spacing={2} sx={{ alignItems: 'flex-start', mt: 1 }}>
        <Icon
          color="primary"
          sx={{ fontSize: 64 }}
          data-testid="profile-avatar"
          data-avatar={user.avatar}
        />
        <Typography variant="h6" data-testid="profile-name">
          {user.name}
        </Typography>
        <Typography data-testid="profile-email">{user.email}</Typography>
        <Typography variant="body2" data-testid="profile-created">
          Member since {formatDate(user.createdAt)}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
          data-testid="profile-logout"
        >
          Log out
        </Button>
      </Stack>
      <ProfileDialog
        open={dialog.open}
        name={dialog.name}
        onNameChange={dialog.setName}
        nameError={dialog.nameError}
        avatar={dialog.avatar}
        onAvatarChange={dialog.setAvatar}
        error={dialog.error}
        saving={dialog.saving}
        onCancel={dialog.close}
        onSave={dialog.save}
        confirmingDelete={dialog.confirmingDelete}
        deleteError={dialog.deleteError}
        deleting={dialog.deleting}
        onDelete={dialog.startDelete}
        onDeleteCancel={dialog.cancelDelete}
        onDeleteConfirm={dialog.confirmDelete}
      />
    </Paper>
  );
};

export default ProfileCard;
