import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { AdminUser, deleteUser, demoteUser, promoteUser, selectUsers } from '@/store/users-slice';
import { useState } from 'react';

export type UserAction = 'promote' | 'demote' | 'delete';

type UseUserActionParams = {
  onChanged: () => void;
};

const useUserAction = ({ onChanged }: UseUserActionParams) => {
  const dispatch = useAppDispatch();
  const { changingId } = useAppSelector(selectUsers);
  const [target, setTarget] = useState<AdminUser | null>(null);
  const [action, setAction] = useState<UserAction>('promote');
  const [error, setError] = useState('');

  const open = (user: AdminUser, next: UserAction) => {
    setTarget(user);
    setAction(next);
    setError('');
  };

  const cancel = () => setTarget(null);

  const confirm = async () => {
    if (!target) {
      return;
    }
    setError('');
    const run = () => {
      switch (action) {
        case 'promote':
          return dispatch(promoteUser(target.id)).unwrap();
        case 'demote':
          return dispatch(demoteUser(target.id)).unwrap();
        case 'delete':
          return dispatch(deleteUser(target.id)).unwrap();
      }
    };
    try {
      await run();
      setTarget(null);
      onChanged();
    } catch (err) {
      setError(String(err));
    }
  };

  return {
    target,
    action,
    error,
    saving: target !== null && changingId === target.id,
    open,
    cancel,
    confirm,
  };
};

export default useUserAction;
