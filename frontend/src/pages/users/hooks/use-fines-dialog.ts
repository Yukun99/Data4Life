import { Loan } from '@/common/types';
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
  const [confirming, setConfirming] = useState<Loan | null>(null);

  const open = (user: AdminUser) => {
    setTarget(user);
    dispatch(fetchFines(user.id));
  };

  const confirmForgive = async () => {
    if (!target || !confirming) {
      return;
    }
    const result = await dispatch(forgiveFine({ userId: target.id, loanId: confirming.id }));
    if (forgiveFine.fulfilled.match(result)) {
      setConfirming(null);
      onForgiven();
    }
  };

  const close = () => {
    setTarget(null);
    setConfirming(null);
    dispatch(clearFines());
  };

  return {
    target,
    fines,
    loading: finesLoading,
    error: finesError,
    forgivingId,
    confirming,
    open,
    askForgive: (loan: Loan) => setConfirming(loan),
    cancelForgive: () => setConfirming(null),
    confirmForgive,
    close,
  };
};

export default useFinesDialog;
