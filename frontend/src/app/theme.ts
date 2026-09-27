import { createTheme, lighten } from '@mui/material/styles';

const navy = '#000040';
const peach = '#FFDACF';

const theme = createTheme({
  cssVariables: { colorSchemeSelector: 'data-mui-color-scheme' },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: navy, contrastText: peach },
        background: { default: peach, paper: peach },
        text: { primary: navy },
        // MUI darkens white by 0.68 for dark-mode row borders; this is the inverse of that grey.
        TableCell: { border: lighten('#000', 0.68) },
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
