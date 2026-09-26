import CenteredCard from '@/common/components/centered-card';
import useCreate from '@/pages/create/hooks/use-create';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { Link as RouterLink } from 'react-router';

const CreatePage = () => {
  const { fields, setField, fieldErrors, error, submitting, submit } = useCreate();

  return (
    <CenteredCard title="Create account">
      <Stack component="form" spacing={2} onSubmit={submit} noValidate>
        {error && (
          <Alert severity="error" data-testid="create-error">
            {error}
          </Alert>
        )}
        <TextField
          label="Name"
          autoComplete="name"
          required
          value={fields.name}
          onChange={(event) => setField('name', event.target.value)}
          error={!!fieldErrors.name}
          helperText={fieldErrors.name}
          slotProps={{ htmlInput: { 'data-testid': 'create-name' } }}
        />
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={fields.email}
          onChange={(event) => setField('email', event.target.value)}
          error={!!fieldErrors.email}
          helperText={fieldErrors.email}
          slotProps={{ htmlInput: { 'data-testid': 'create-email' } }}
        />
        <TextField
          label="Password"
          type="password"
          autoComplete="new-password"
          required
          value={fields.password}
          onChange={(event) => setField('password', event.target.value)}
          error={!!fieldErrors.password}
          helperText={fieldErrors.password || '8 to 32 characters, no spaces'}
          slotProps={{ htmlInput: { 'data-testid': 'create-password' } }}
        />
        <Button
          type="submit"
          variant="contained"
          startIcon={<PersonAddIcon />}
          loading={submitting}
          data-testid="create-submit"
        >
          Create account
        </Button>
        <Typography variant="body2">
          Already have an account?{' '}
          <Link component={RouterLink} to="/login">
            Log in
          </Link>
        </Typography>
      </Stack>
    </CenteredCard>
  );
};

export default CreatePage;
