import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import HomeIcon from '@mui/icons-material/Home';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import PeopleIcon from '@mui/icons-material/People';
import type SvgIcon from '@mui/material/SvgIcon';

export type Page = {
  path: string;
  label: string;
  icon: typeof SvgIcon;
  testId: string;
  admin?: boolean;
};

export const PAGES: Page[] = [
  { path: '/', label: 'Home', icon: HomeIcon, testId: 'nav-home' },
  { path: '/borrow', label: 'Borrow', icon: MenuBookIcon, testId: 'nav-borrow' },
  { path: '/return', label: 'Return', icon: AssignmentReturnIcon, testId: 'nav-return' },
  { path: '/reserve', label: 'Reserve', icon: EventAvailableIcon, testId: 'nav-reserve' },
  { path: '/profile', label: 'Profile', icon: AccountCircleIcon, testId: 'nav-profile' },
  { path: '/users', label: 'Users', icon: PeopleIcon, testId: 'nav-users', admin: true },
  {
    path: '/catalogue',
    label: 'Catalogue',
    icon: LibraryBooksIcon,
    testId: 'nav-catalogue',
    admin: true,
  },
];
