import NotificationItem from '@/features/notifications/notification-item';
import { Notification } from '@/store/notification-slice';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import LinearProgress from '@mui/material/LinearProgress';
import List from '@mui/material/List';
import Popover from '@mui/material/Popover';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { UIEvent } from 'react';

type NotificationPanelProps = {
  anchor: HTMLElement | null;
  items: Notification[];
  unread: number;
  loading: boolean;
  error: string;
  onClose: () => void;
  onScroll: (event: UIEvent<HTMLElement>) => void;
  onSelect: (item: Notification) => void;
  onRead: (item: Notification) => void;
  onDelete: (item: Notification) => void;
  onReadAll: () => void;
  onDeleteAll: () => void;
};

const NotificationPanel = ({
  anchor,
  items,
  unread,
  loading,
  error,
  onClose,
  onScroll,
  onSelect,
  onRead,
  onDelete,
  onReadAll,
  onDeleteAll,
}: NotificationPanelProps) => (
  <Popover
    open={!!anchor}
    anchorEl={anchor}
    onClose={onClose}
    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
    slotProps={{ paper: { sx: { width: 380, maxWidth: 'calc(100vw - 32px)' } } }}
    data-testid="notifications-panel"
  >
    <Stack direction="row" spacing={1} sx={{ p: 1, alignItems: 'center' }}>
      <Typography variant="subtitle1" sx={{ flex: 1, pl: 1 }}>
        Notifications
      </Typography>
      <Button
        size="small"
        disabled={unread === 0}
        onClick={onReadAll}
        data-testid="notifications-read-all"
      >
        Mark all as read
      </Button>
      <Button
        size="small"
        color="error"
        disabled={items.length === 0}
        onClick={onDeleteAll}
        data-testid="notifications-delete-all"
      >
        Delete all
      </Button>
    </Stack>
    <Divider />
    {error && (
      <Alert severity="error" sx={{ m: 1 }} data-testid="notifications-error">
        {error}
      </Alert>
    )}
    <List
      disablePadding
      onScroll={onScroll}
      sx={{ maxHeight: 400, overflow: 'auto' }}
      data-testid="notifications-list"
    >
      {items.map((item) => (
        <NotificationItem
          key={item.id}
          item={item}
          onSelect={onSelect}
          onRead={onRead}
          onDelete={onDelete}
        />
      ))}
      {!loading && items.length === 0 && (
        <Typography color="text.secondary" sx={{ p: 2 }} data-testid="notifications-empty">
          No notifications
        </Typography>
      )}
    </List>
    {loading && <LinearProgress data-testid="notifications-loading" />}
  </Popover>
);

export default NotificationPanel;
