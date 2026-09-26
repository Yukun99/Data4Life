import CenteredCard from '@/common/components/centered-card';
import useLogin from '@/pages/login/hooks/use-login';
import LoginIcon from '@mui/icons-material/Login';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { Link as RouterLink } from 'react-router';

const LoginPage = () => {
  const { email, setEmail, password, setPassword, error, submitting, submit } = useLogin();

  return (
    <CenteredCard title="Log in">
      <Stack component="form" spacing={2} onSubmit={submit}>
        {error && (
          <Alert severity="error" data-testid="login-error">
            {error}
          </Alert>
        )}
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          slotProps={{ htmlInput: { 'data-testid': 'login-email' } }}
        />
        <TextField
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          slotProps={{ htmlInput: { 'data-testid': 'login-password' } }}
        />
        <Button
          type="submit"
          variant="contained"
          startIcon={<LoginIcon />}
          loading={submitting}
          data-testid="login-submit"
        >
          Log in
        </Button>
        <Typography variant="body2">
          No account yet?{' '}
          <Link component={RouterLink} to="/create">
            Create one
          </Link>
        </Typography>
      </Stack>
    </CenteredCard>
  );
};

export default LoginPage;
