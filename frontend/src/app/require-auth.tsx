import { useAppSelector } from '@/store/hooks';
import { selectUser, selectUserLoading } from '@/store/user-slice';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { Navigate, Outlet } from 'react-router';

type RequireAuthProps = {
  /** When true, only logged-out visitors may pass; logged-in users go to the home page. */
  guest?: boolean;
};

const RequireAuth = ({ guest = false }: RequireAuthProps) => {
  const user = useAppSelector(selectUser);
  const loading = useAppSelector(selectUserLoading);

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (guest) {
    return user ? (
      <Navigate to="/" replace />
    ) : (
      <Box sx={{ minHeight: '100vh', display: 'grid' }}>
        <Outlet />
      </Box>
    );
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

export default RequireAuth;
