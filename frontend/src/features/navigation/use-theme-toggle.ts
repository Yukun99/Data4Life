import { useColorScheme } from '@mui/material/styles';

const useThemeToggle = () => {
  const { mode, systemMode, setMode } = useColorScheme();
  const isDark = ((mode === 'system' ? systemMode : mode) ?? 'light') === 'dark';

  const toggle = () => setMode(isDark ? 'light' : 'dark');

  return { isDark, toggle };
};

export default useThemeToggle;
