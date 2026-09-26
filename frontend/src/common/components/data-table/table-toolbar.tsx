import FilterList from '@mui/icons-material/FilterList';
import Badge from '@mui/material/Badge';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { ReactNode } from 'react';

type TableToolbarProps = {
  size: number;
  sizes: number[];
  activeFilters: number;
  onFilter: () => void;
  onSizeChange: (size: number) => void;
  testIdPrefix: string;
  actions?: ReactNode;
};

const TableToolbar = ({
  size,
  sizes,
  activeFilters,
  onFilter,
  onSizeChange,
  testIdPrefix,
  actions,
}: TableToolbarProps) => (
  <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
    {actions}
    <Badge badgeContent={activeFilters} color="primary" data-testid={`${testIdPrefix}-filter-count`}>
      <Button
        variant="outlined"
        startIcon={<FilterList />}
        onClick={onFilter}
        data-testid={`${testIdPrefix}-filter`}
      >
        Filter
      </Button>
    </Badge>
    <TextField
      select
      size="small"
      label="Per page"
      value={size}
      onChange={(event) => onSizeChange(Number(event.target.value))}
      sx={{ ml: 'auto !important', width: 110 }}
      slotProps={{ select: { native: true }, htmlInput: { 'data-testid': `${testIdPrefix}-size` } }}
    >
      {sizes.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </TextField>
  </Stack>
);

export default TableToolbar;
