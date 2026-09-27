import { daysUntil, formatDays, formatMoney } from '@/common/utils/format';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  payAllReturnFines,
  payReturnFine,
  returnLoan,
  ReturnLoan,
  selectReturns,
  unreserveLoan,
} from '@/store/return-slice';
import { useState } from 'react';

export type ReturnAction = 'return' | 'unreserve' | 'pay' | 'payAll';

type Target = { loan: ReturnLoan | null; action: ReturnAction };

type UseReturnActionParams = {
  onDone: () => void;
};

type DialogTextParams = Target & { totalUnpaid: number };

const PAY_BODY = 'This records the payment on your account.';

const dueText = (dueAt: string | null) => {
  const days = daysUntil(dueAt ?? '');
  return days <= 0 ? 'Due today.' : `Due in ${formatDays(days)}.`;
};

const dialogText = ({ loan, action, totalUnpaid }: DialogTextParams) => {
  if (action === 'payAll') {
    return {
      title: `Pay all fines (${formatMoney(totalUnpaid)})?`,
      body: PAY_BODY,
      confirmLabel: 'Pay',
    };
  }
  if (!loan) {
    return { title: '', body: '', confirmLabel: '' };
  }
  if (action === 'pay') {
    return {
      title: `Pay ${formatMoney(loan.fine)} fine for ${loan.title}?`,
      body: PAY_BODY,
      confirmLabel: 'Pay',
    };
  }
  if (action === 'unreserve') {
    return {
      title: `Cancel reservation for ${loan.title}?`,
      body: 'The $5.00 fee is not refunded. The copy goes back on the shelf.',
      confirmLabel: 'Unreserve',
    };
  }
  return {
    title: `Return ${loan.title}?`,
    body:
      loan.status === 'OVERDUE'
        ? `${formatDays(loan.overdueDays)} overdue. A ${formatMoney(loan.fine)} fine becomes payable after return.`
        : dueText(loan.dueAt),
    confirmLabel: 'Return',
  };
};

const useReturnAction = ({ onDone }: UseReturnActionParams) => {
  const dispatch = useAppDispatch();
  const { actingId, payingAll, totalUnpaid } = useAppSelector(selectReturns);
  const [target, setTarget] = useState<Target | null>(null);
  const [text, setText] = useState({ title: '', body: '', confirmLabel: '' });
  const [error, setError] = useState('');

  const open = (loan: ReturnLoan | null, action: ReturnAction) => {
    setTarget({ loan, action });
    setText(dialogText({ loan, action, totalUnpaid }));
    setError('');
  };

  const cancel = () => setTarget(null);

  const run = ({ loan, action }: Target) => {
    const id = loan?.id ?? 0;
    switch (action) {
      case 'payAll':
        return dispatch(payAllReturnFines()).unwrap();
      case 'pay':
        return dispatch(payReturnFine(id)).unwrap();
      case 'unreserve':
        return dispatch(unreserveLoan(id)).unwrap();
      case 'return':
        return dispatch(returnLoan(id)).unwrap();
    }
  };

  const confirm = async () => {
    if (!target) {
      return;
    }
    setError('');
    try {
      await run(target);
      setTarget(null);
      onDone();
    } catch (err) {
      setError(String(err));
    }
  };

  return {
    target,
    text,
    error,
    saving: actingId !== null || payingAll,
    open,
    cancel,
    confirm,
  };
};

export default useReturnAction;
