import { errorMessage } from '@/common/utils/api';
import { useAppDispatch } from '@/store/hooks';
import { login } from '@/store/user-slice';
import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router';

const useLogin = () => {
  const dispatch = useAppDispatch();
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
      await dispatch(login({ email, password })).unwrap();
      navigate('/borrow');
    } catch (err) {
      setError(typeof err === 'string' ? err : errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return { email, setEmail, password, setPassword, error, submitting, submit };
};

export default useLogin;
