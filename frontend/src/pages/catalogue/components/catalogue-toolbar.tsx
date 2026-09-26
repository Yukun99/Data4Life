import { PAGE_SIZES } from '@/store/catalogue-slice';
import Add from '@mui/icons-material/Add';
import FilterList from '@mui/icons-material/FilterList';
import Badge from '@mui/material/Badge';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';

type CatalogueToolbarProps = {
  size: number;
  activeFilters: number;
  onAdd: () => void;
  onFilter: () => void;
  onSizeChange: (size: number) => void;
};

const CatalogueToolbar = ({
  size,
  activeFilters,
  onAdd,
  onFilter,
  onSizeChange,
}: CatalogueToolbarProps) => (
  <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
    <Button variant="contained" startIcon={<Add />} onClick={onAdd} data-testid="catalogue-add">
      Add
    </Button>
    <Badge badgeContent={activeFilters} color="primary" data-testid="catalogue-filter-count">
      <Button
        variant="outlined"
        startIcon={<FilterList />}
        onClick={onFilter}
        data-testid="catalogue-filter"
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
      slotProps={{ select: { native: true }, htmlInput: { 'data-testid': 'catalogue-size' } }}
    >
      {PAGE_SIZES.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </TextField>
  </Stack>
);

export default CatalogueToolbar;
