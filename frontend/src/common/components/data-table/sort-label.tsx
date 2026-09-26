import { SortState } from '@/common/components/data-table/types';
import ArrowDropDown from '@mui/icons-material/ArrowDropDown';
import ArrowDropUp from '@mui/icons-material/ArrowDropUp';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';

type SortLabelProps<S extends string> = {
  label: string;
  sortKey: S;
  sort: SortState<S>;
  onClick: (key: S) => void;
};

const SortLabel = <S extends string>({ label, sortKey, sort, onClick }: SortLabelProps<S>) => {
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
