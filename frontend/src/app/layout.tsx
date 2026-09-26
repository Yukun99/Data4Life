import Header from '@/features/navigation/header';
import Box from '@mui/material/Box';
import { Outlet } from 'react-router';

const Layout = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
    <Header />
    <Box component="main" sx={{ flex: 1, minHeight: 0, display: 'grid', overflow: 'auto' }}>
      <Outlet />
    </Box>
  </Box>
);

export default Layout;
