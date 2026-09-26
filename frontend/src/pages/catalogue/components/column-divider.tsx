import { ColumnKey } from '@/store/catalogue-slice';
import Box from '@mui/material/Box';
import { PointerEvent } from 'react';

type ColumnDividerProps = {
  columnKey: ColumnKey;
  onPointerDown: (event: PointerEvent<HTMLElement>) => void;
};

const ColumnDivider = ({ columnKey, onPointerDown }: ColumnDividerProps) => (
  <Box
    role="separator"
    aria-orientation="vertical"
    aria-label={`Resize ${columnKey} column`}
    onPointerDown={onPointerDown}
    data-testid={`resize-${columnKey}`}
    sx={{
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      width: 8,
      cursor: 'col-resize',
      touchAction: 'none',
      '&::after': {
        content: '""',
        position: 'absolute',
        top: 8,
        bottom: 8,
        right: 3,
        width: '2px',
        bgcolor: 'divider',
      },
      '&:hover::after': { bgcolor: 'primary.main' },
    }}
  />
);

export default ColumnDivider;
