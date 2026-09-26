import NavDrawer from '@/features/navigation/nav-drawer';
import ThemeToggle from '@/features/navigation/theme-toggle';
import MenuIcon from '@mui/icons-material/Menu';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { useState } from 'react';

const Header = () => {
  const [open, setOpen] = useState(false);

  return (
    <Box
      component="header"
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: (theme) => theme.zIndex.appBar,
        display: 'flex',
        alignItems: 'center',
        px: 1,
        py: 0.5,
        bgcolor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <IconButton
        color="inherit"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
        data-testid="header-menu"
      >
        <MenuIcon />
      </IconButton>
      <Typography variant="h6" component="span" sx={{ flex: 1, textAlign: 'center' }}>
        Library
      </Typography>
      <ThemeToggle />
      <NavDrawer open={open} onClose={() => setOpen(false)} />
    </Box>
  );
};

export default Header;
