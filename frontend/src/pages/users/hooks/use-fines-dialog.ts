import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { AdminUser, clearFines, fetchFines, forgiveFine, selectUsers } from '@/store/users-slice';
import { useState } from 'react';

type UseFinesDialogParams = {
  onForgiven: () => void;
};

const useFinesDialog = ({ onForgiven }: UseFinesDialogParams) => {
  const dispatch = useAppDispatch();
  const { fines, finesLoading, finesError, forgivingId } = useAppSelector(selectUsers);
  const [target, setTarget] = useState<AdminUser | null>(null);

  const open = (user: AdminUser) => {
    setTarget(user);
    dispatch(fetchFines(user.id));
  };

  const forgive = async (loanId: number) => {
    if (!target) {
      return;
    }
    const result = await dispatch(forgiveFine({ userId: target.id, loanId }));
    if (forgiveFine.fulfilled.match(result)) {
      onForgiven();
    }
  };

  const close = () => {
    setTarget(null);
    dispatch(clearFines());
  };

  return {
    target,
    fines,
    loading: finesLoading,
    error: finesError,
    forgivingId,
    open,
    forgive,
    close,
  };
};

export default useFinesDialog;
