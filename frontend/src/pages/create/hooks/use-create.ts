import { apiFetch, errorMessage } from '@/common/utils/api';
import { useAppDispatch } from '@/store/hooks';
import { login } from '@/store/user-slice';
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
  const dispatch = useAppDispatch();
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
      await dispatch(login({ email: fields.email, password: fields.password })).unwrap();
      navigate('/');
    } catch (err) {
      setError(typeof err === 'string' ? err : errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return { fields, setField, fieldErrors, error, submitting, submit };
};

export default useCreate;
