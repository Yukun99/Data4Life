import { createTheme } from '@mui/material/styles';

const navy = '#000076';
const peach = '#FFDACF';

const theme = createTheme({
  cssVariables: { colorSchemeSelector: 'media' },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: navy, contrastText: peach },
        background: { default: peach, paper: peach },
        text: { primary: navy },
      },
    },
    dark: {
      palette: {
        primary: { main: peach, contrastText: navy },
        background: { default: navy, paper: navy },
        text: { primary: peach },
      },
    },
  },
  typography: {
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  },
});

export default theme;
