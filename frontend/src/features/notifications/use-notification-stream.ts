import { useAppDispatch } from '@/store/hooks';
import {
  fetchNotifications,
  fetchUnreadCount,
  Notification,
  received,
} from '@/store/notification-slice';
import { useEffect } from 'react';

/** Keeps the notification list live over Server-Sent Events while mounted. */
const useNotificationStream = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const source = new EventSource('/api/notifications/stream');
    const refresh = () => {
      dispatch(fetchNotifications());
      dispatch(fetchUnreadCount());
    };
    const receive = (event: MessageEvent<string>) => {
      dispatch(received(JSON.parse(event.data) as Notification));
    };
    source.addEventListener('open', refresh);
    source.addEventListener('notification', receive);
    return () => source.close();
  }, [dispatch]);
};

export default useNotificationStream;
