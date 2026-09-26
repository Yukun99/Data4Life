import useAuth from '@/common/hooks/use-auth';
import { errorMessage } from '@/common/utils/api';
import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router';

const useLogin = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/profile');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return { email, setEmail, password, setPassword, error, submitting, submit };
};

export default useLogin;
