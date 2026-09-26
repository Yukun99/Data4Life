import { Sort, SortKey } from '@/store/catalogue-slice';
import ArrowDropDown from '@mui/icons-material/ArrowDropDown';
import ArrowDropUp from '@mui/icons-material/ArrowDropUp';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';

type SortLabelProps = {
  label: string;
  sortKey: SortKey;
  sort: Sort;
  onClick: (key: SortKey) => void;
};

const SortLabel = ({ label, sortKey, sort, onClick }: SortLabelProps) => {
  const dir = sort?.key === sortKey ? sort.dir : null;
  const arrow = { fontSize: 18, my: '-6px' };
  return (
    <ButtonBase
      onClick={() => onClick(sortKey)}
      aria-label={`Sort by ${label}`}
      data-dir={dir ?? 'none'}
      data-testid={`sort-${sortKey}`}
      sx={{ gap: 0.25, justifyContent: 'flex-start', borderRadius: 1 }}
    >
      <Box
        component="span"
        sx={{
          fontWeight: dir ? 'bold' : 'inherit',
          textDecoration: dir ? 'underline' : 'none',
        }}
        data-testid={`sort-${sortKey}-label`}
      >
        {label}
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <ArrowDropUp
          sx={{ ...arrow, color: dir === 'asc' ? 'primary.main' : 'text.disabled' }}
          data-active={dir === 'asc'}
          data-testid={`sort-${sortKey}-up`}
        />
        <ArrowDropDown
          sx={{ ...arrow, color: dir === 'desc' ? 'primary.main' : 'text.disabled' }}
          data-active={dir === 'desc'}
          data-testid={`sort-${sortKey}-down`}
        />
      </Box>
    </ButtonBase>
  );
};

export default SortLabel;
