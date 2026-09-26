import { AuthContext } from '@/common/contexts/auth-context';
import { useContext } from 'react';

const useAuth = () => {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return value;
};

export default useAuth;
