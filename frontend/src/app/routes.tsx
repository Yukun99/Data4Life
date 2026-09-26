import DocumentTitle from '@/app/document-title';
import Layout from '@/app/layout';
import RequireAdmin from '@/app/require-admin';
import RequireAuth from '@/app/require-auth';
import BorrowPage from '@/pages/borrow/borrow-page';
import CataloguePage from '@/pages/catalogue/catalogue-page';
import CreatePage from '@/pages/create/create-page';
import HomePage from '@/pages/home/home-page';
import LoginPage from '@/pages/login/login-page';
import ProfilePage from '@/pages/profile/profile-page';
import ReservePage from '@/pages/reserve/reserve-page';
import ReturnPage from '@/pages/return/return-page';
import UsersPage from '@/pages/users/users-page';
import { useAppDispatch } from '@/store/hooks';
import { fetchMe } from '@/store/user-slice';
import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router';

const AppRoutes = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchMe());
  }, [dispatch]);

  return (
    <>
      <DocumentTitle />
      <Routes>
        <Route element={<RequireAuth guest />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/create" element={<CreatePage />} />
        </Route>
        <Route element={<RequireAuth />}>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/borrow" element={<BorrowPage />} />
            <Route path="/return" element={<ReturnPage />} />
            <Route path="/reserve" element={<ReservePage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route element={<RequireAdmin />}>
              <Route path="/users" element={<UsersPage />} />
              <Route path="/catalogue" element={<CataloguePage />} />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

export default AppRoutes;
