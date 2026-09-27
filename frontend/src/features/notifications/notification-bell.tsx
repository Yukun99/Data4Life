import ConfirmDialog from '@/common/components/confirm-dialog';
import NotificationPanel from '@/features/notifications/notification-panel';
import useNotificationBell from '@/features/notifications/use-notification-bell';
import NotificationsIcon from '@mui/icons-material/Notifications';
import Badge from '@mui/material/Badge';
import IconButton from '@mui/material/IconButton';

const NotificationBell = () => {
  const bell = useNotificationBell();

  return (
    <>
      <IconButton
        color="inherit"
        onClick={bell.open}
        aria-label="Open notifications"
        data-testid="header-notifications"
      >
        <Badge
          color="error"
          badgeContent={bell.unread}
          invisible={bell.unread === 0}
          slotProps={{ badge: { 'data-testid': 'header-notifications-count' } as object }}
        >
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <NotificationPanel
        anchor={bell.anchor}
        items={bell.items}
        unread={bell.unread}
        loading={bell.loading}
        error={bell.error}
        onClose={bell.close}
        onScroll={bell.scroll}
        onSelect={bell.select}
        onRead={bell.read}
        onDelete={bell.remove}
        onReadAll={bell.readAll}
        onDeleteAll={bell.askDeleteAll}
      />
      <ConfirmDialog
        open={bell.confirming}
        title="Delete all notifications?"
        body="This cannot be undone."
        confirmLabel="Delete all"
        color="error"
        error={bell.confirmError}
        loading={bell.deleting}
        onCancel={bell.cancelDeleteAll}
        onConfirm={bell.confirmDeleteAll}
        testIdPrefix="notifications-confirm"
      />
    </>
  );
};

export default NotificationBell;
