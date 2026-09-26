import ChevronLeft from '@mui/icons-material/ChevronLeft';
import ChevronRight from '@mui/icons-material/ChevronRight';
import FirstPage from '@mui/icons-material/FirstPage';
import LastPage from '@mui/icons-material/LastPage';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useState } from 'react';

type CataloguePaginationProps = {
  page: number;
  totalPages: number;
  onGoTo: (page: number) => void;
};

const CataloguePagination = ({ page, totalPages, onGoTo }: CataloguePaginationProps) => {
  const [draft, setDraft] = useState<string | null>(null);
  const pages = Math.max(totalPages, 1);
  const atStart = page <= 0;
  const atEnd = page >= pages - 1;

  const commit = () => {
    if (draft === null) {
      return;
    }
    setDraft(null);
    const value = draft.trim();
    if (!/^\d+$/.test(value)) {
      return;
    }
    const target = Math.min(Math.max(Number(value), 1), pages) - 1;
    if (target !== page) {
      onGoTo(target);
    }
  };

  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'center' }}>
      <IconButton
        aria-label="First page"
        disabled={atStart}
        onClick={() => onGoTo(0)}
        data-testid="catalogue-first"
      >
        <FirstPage />
      </IconButton>
      <IconButton
        aria-label="Previous page"
        disabled={atStart}
        onClick={() => onGoTo(page - 1)}
        data-testid="catalogue-prev"
      >
        <ChevronLeft />
      </IconButton>
      <TextField
        size="small"
        value={draft ?? String(page + 1)}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => event.key === 'Enter' && commit()}
        sx={{ width: 72 }}
        slotProps={{
          htmlInput: {
            inputMode: 'numeric',
            'aria-label': 'Page',
            style: { textAlign: 'center' },
            'data-testid': 'catalogue-page-input',
          },
        }}
      />
      <Typography data-testid="catalogue-total-pages">/ {pages}</Typography>
      <IconButton
        aria-label="Next page"
        disabled={atEnd}
        onClick={() => onGoTo(page + 1)}
        data-testid="catalogue-next"
      >
        <ChevronRight />
      </IconButton>
      <IconButton
        aria-label="Last page"
        disabled={atEnd}
        onClick={() => onGoTo(pages - 1)}
        data-testid="catalogue-last"
      >
        <LastPage />
      </IconButton>
    </Stack>
  );
};

export default CataloguePagination;
