import { PAGES } from '@/features/navigation/pages';
import { useAppSelector } from '@/store/hooks';
import { selectIsAdmin } from '@/store/user-slice';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { useLocation, useNavigate } from 'react-router';

type NavDrawerProps = {
  open: boolean;
  onClose: () => void;
};

const NavDrawer = ({ open, onClose }: NavDrawerProps) => {
  const isAdmin = useAppSelector(selectIsAdmin);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const go = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <Drawer anchor="left" open={open} onClose={onClose}>
      <List sx={{ width: 250 }}>
        {PAGES.filter((page) => isAdmin || !page.admin).map(({ path, label, icon: Icon, testId }) => (
          <ListItemButton
            key={path}
            selected={pathname === path}
            onClick={() => go(path)}
            data-testid={testId}
          >
            <ListItemIcon>
              <Icon />
            </ListItemIcon>
            <ListItemText primary={label} />
          </ListItemButton>
        ))}
      </List>
    </Drawer>
  );
};

export default NavDrawer;
