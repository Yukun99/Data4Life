import Header from '@/features/navigation/header';
import Box from '@mui/material/Box';
import { Outlet } from 'react-router';

const Layout = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
    <Header />
    <Box component="main" sx={{ flex: 1, display: 'grid' }}>
      <Outlet />
    </Box>
  </Box>
);

export default Layout;
