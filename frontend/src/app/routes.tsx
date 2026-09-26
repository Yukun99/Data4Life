import RequireAuth from '@/app/require-auth';
import CreatePage from '@/pages/create/create-page';
import LoginPage from '@/pages/login/login-page';
import ProfilePage from '@/pages/profile/profile-page';
import { Navigate, Route, Routes } from 'react-router';

const AppRoutes = () => (
  <Routes>
    <Route element={<RequireAuth guest />}>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/create" element={<CreatePage />} />
    </Route>
    <Route element={<RequireAuth />}>
      <Route path="/profile" element={<ProfilePage />} />
    </Route>
    <Route path="/" element={<Navigate to="/profile" replace />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default AppRoutes;
