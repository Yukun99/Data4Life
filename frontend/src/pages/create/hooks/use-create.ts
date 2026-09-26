import useAuth from '@/common/hooks/use-auth';
import { apiFetch, errorMessage } from '@/common/utils/api';
import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router';

type Fields = {
  name: string;
  email: string;
  password: string;
};

const empty: Fields = { name: '', email: '', password: '' };

/** Mirrors the backend rules in CreateUserRequest. */
const validate = ({ name, email, password }: Fields): Fields => ({
  name: name.trim() && name.trim().length <= 100 ? '' : 'Enter a name of up to 100 characters',
  email: /^\S+@\S+\.\S+$/.test(email.trim()) ? '' : 'Enter a valid email address',
  password: /^\S{8,32}$/.test(password) ? '' : 'Use 8 to 32 characters with no spaces',
});

const useCreate = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [fields, setFields] = useState<Fields>(empty);
  const [fieldErrors, setFieldErrors] = useState<Fields>(empty);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const setField = (field: keyof Fields, value: string) =>
    setFields((current) => ({ ...current, [field]: value }));

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    const errors = validate(fields);
    setFieldErrors(errors);
    if (Object.values(errors).some(Boolean)) {
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch('/api/users', { method: 'POST', body: JSON.stringify(fields) });
      await login(fields.email, fields.password);
      navigate('/profile');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return { fields, setField, fieldErrors, error, submitting, submit };
};

export default useCreate;
