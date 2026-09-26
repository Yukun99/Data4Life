import useThemeToggle from '@/features/navigation/use-theme-toggle';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import IconButton from '@mui/material/IconButton';

const ThemeToggle = () => {
  const { isDark, toggle } = useThemeToggle();

  return (
    <IconButton
      color="inherit"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      data-testid="header-theme"
    >
      {isDark ? <LightModeIcon /> : <DarkModeIcon />}
    </IconButton>
  );
};

export default ThemeToggle;
