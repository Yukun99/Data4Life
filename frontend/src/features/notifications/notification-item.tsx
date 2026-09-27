import { formatDate } from '@/common/utils/format';
import { Notification } from '@/store/notification-slice';
import DeleteIcon from '@mui/icons-material/Delete';
import DoneIcon from '@mui/icons-material/Done';
import IconButton from '@mui/material/IconButton';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';

type NotificationItemProps = {
  item: Notification;
  onSelect: (item: Notification) => void;
  onRead: (item: Notification) => void;
  onDelete: (item: Notification) => void;
};

const message = ({ type, title }: Notification) => {
  switch (type) {
    case 'AVAILABLE':
      return `${title} is ready. Borrow it within 7 days.`;
    case 'REMOVED_UNPAID':
      return `You were removed from the queue for ${title} because you have unpaid fines.`;
    case 'REMOVED_OVERDUE':
      return `You were removed from the queue for ${title} because you have an overdue book.`;
  }
};

const NotificationItem = ({ item, onSelect, onRead, onDelete }: NotificationItemProps) => (
  <ListItem
    disablePadding
    data-testid={`notification-${item.id}`}
    sx={{ bgcolor: item.read ? undefined : 'action.selected' }}
    secondaryAction={
      <Stack direction="row">
        {!item.read && (
          <IconButton
            size="small"
            aria-label="Mark as read"
            onClick={() => onRead(item)}
            data-testid={`notification-read-${item.id}`}
          >
            <DoneIcon fontSize="small" />
          </IconButton>
        )}
        <IconButton
          size="small"
          aria-label="Delete"
          onClick={() => onDelete(item)}
          data-testid={`notification-delete-${item.id}`}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Stack>
    }
  >
    <ListItemButton onClick={() => onSelect(item)} sx={{ pr: 10 }}>
      <ListItemText
        primary={message(item)}
        secondary={formatDate(item.createdAt)}
        slotProps={{
          primary: {
            sx: {
              fontWeight: item.read ? 400 : 700,
              color: item.read ? 'text.secondary' : 'text.primary',
            },
          },
        }}
      />
    </ListItemButton>
  </ListItem>
);

export default NotificationItem;
