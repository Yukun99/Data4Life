import { useAppSelector } from '@/store/hooks';
import { selectIsAdmin } from '@/store/user-slice';
import { Navigate, Outlet } from 'react-router';

const RequireAdmin = () =>
  useAppSelector(selectIsAdmin) ? <Outlet /> : <Navigate to="/borrow" replace />;

export default RequireAdmin;
