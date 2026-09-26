import HistoryPanel from '@/pages/profile/components/history-panel';
import InterestsCard from '@/pages/profile/components/interests-card';
import ProfileCard from '@/pages/profile/components/profile-card';
import { useAppSelector } from '@/store/hooks';
import { selectUser } from '@/store/user-slice';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';

const ProfilePage = () => {
  const user = useAppSelector(selectUser);

  if (!user) {
    return null;
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '340px 1fr' },
        gap: 2,
        p: 2,
        alignItems: 'start',
      }}
    >
      <Stack spacing={2}>
        <ProfileCard user={user} />
        <InterestsCard />
      </Stack>
      <HistoryPanel />
    </Box>
  );
};

export default ProfilePage;
