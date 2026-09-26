import AppRoutes from '@/app/routes';
import theme from '@/app/theme';
import { store } from '@/store/store';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router';

const App = () => (
  <Provider store={store}>
    <ThemeProvider theme={theme} defaultMode="system" noSsr>
      <CssBaseline />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ThemeProvider>
  </Provider>
);

export default App;
