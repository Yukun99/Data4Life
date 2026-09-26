import CenteredCard from '@/common/components/centered-card';
import useAuth from '@/common/hooks/use-auth';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useNavigate } from 'react-router';

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <CenteredCard title="Profile">
      <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
        <AccountCircleIcon color="primary" sx={{ fontSize: 64 }} />
        <Typography variant="h6" data-testid="profile-name">
          {user.name}
        </Typography>
        <Typography data-testid="profile-email">{user.email}</Typography>
        <Typography variant="body2" data-testid="profile-created">
          Member since {new Date(user.createdAt).toLocaleDateString()}
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
    </CenteredCard>
  );
};

export default ProfilePage;
