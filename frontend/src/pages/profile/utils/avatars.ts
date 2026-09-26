import { Avatar } from '@/store/user-slice';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import BoltIcon from '@mui/icons-material/Bolt';
import FaceIcon from '@mui/icons-material/Face';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import PetsIcon from '@mui/icons-material/Pets';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import SpaIcon from '@mui/icons-material/Spa';
import StarIcon from '@mui/icons-material/Star';
import SvgIcon from '@mui/material/SvgIcon';

export const AVATARS: Record<Avatar, typeof SvgIcon> = {
  ACCOUNT: AccountCircleIcon,
  FACE: FaceIcon,
  PETS: PetsIcon,
  ROCKET: RocketLaunchIcon,
  BOOK: MenuBookIcon,
  STAR: StarIcon,
  BOLT: BoltIcon,
  SPA: SpaIcon,
};

export const AVATAR_KEYS = Object.keys(AVATARS) as Avatar[];
