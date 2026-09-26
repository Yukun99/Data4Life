import useAuth from '@/common/hooks/use-auth';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { Navigate, Outlet } from 'react-router';

type RequireAuthProps = {
  /** When true, only logged-out visitors may pass; logged-in users go to their profile. */
  guest?: boolean;
};

const RequireAuth = ({ guest = false }: RequireAuthProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  const allowed = guest ? !user : !!user;
  return allowed ? <Outlet /> : <Navigate to={guest ? '/profile' : '/login'} replace />;
};

export default RequireAuth;
