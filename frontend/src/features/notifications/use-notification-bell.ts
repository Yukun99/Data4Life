import useNotificationStream from '@/features/notifications/use-notification-stream';
import { showBook } from '@/store/borrow-slice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  deleteAllNotifications,
  deleteNotification,
  fetchMoreNotifications,
  markAllRead,
  markRead,
  Notification,
  selectNotifications,
} from '@/store/notification-slice';
import { MouseEvent, UIEvent, useState } from 'react';
import { useNavigate } from 'react-router';

const NEAR_BOTTOM = 40;

const useNotificationBell = () => {
  useNotificationStream();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const notifications = useAppSelector(selectNotifications);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmError, setConfirmError] = useState('');

  const close = () => setAnchor(null);

  const select = (item: Notification) => {
    if (!item.read) {
      dispatch(markRead(item.id));
    }
    close();
    if (item.type === 'AVAILABLE') {
      dispatch(showBook(item.isbn));
      navigate('/borrow');
    } else {
      navigate('/profile');
    }
  };

  const scroll = (event: UIEvent<HTMLElement>) => {
    const { scrollHeight, scrollTop, clientHeight } = event.currentTarget;
    if (
      notifications.hasMore &&
      !notifications.loading &&
      scrollHeight - scrollTop - clientHeight < NEAR_BOTTOM
    ) {
      dispatch(fetchMoreNotifications());
    }
  };

  const askDeleteAll = () => {
    setConfirmError('');
    setConfirming(true);
  };

  const confirmDeleteAll = async () => {
    setDeleting(true);
    setConfirmError('');
    try {
      await dispatch(deleteAllNotifications()).unwrap();
      setConfirming(false);
    } catch (err) {
      setConfirmError(String(err));
    } finally {
      setDeleting(false);
    }
  };

  return {
    ...notifications,
    anchor,
    confirming,
    deleting,
    confirmError,
    open: (event: MouseEvent<HTMLElement>) => setAnchor(event.currentTarget),
    close,
    select,
    scroll,
    read: (item: Notification) => dispatch(markRead(item.id)),
    remove: (item: Notification) => dispatch(deleteNotification(item.id)),
    readAll: () => dispatch(markAllRead()),
    askDeleteAll,
    cancelDeleteAll: () => setConfirming(false),
    confirmDeleteAll,
  };
};

export default useNotificationBell;
