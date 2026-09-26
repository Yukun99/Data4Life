import { BookFilter, EMPTY_FILTER, FilterOptions } from '@/store/catalogue-slice';
import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useState } from 'react';

type FilterDialogProps = {
  filter: BookFilter;
  options: FilterOptions | null;
  onApply: (filter: BookFilter) => void;
  onCancel: () => void;
};

type Option = { value: string; label: string };

type FilterField = { key: keyof BookFilter; label: string; testId: string; options: Option[] };

const plain = (values: (string | number)[] = []) =>
  values.map((value) => ({ value: String(value), label: String(value) }));

const named = (items: { id: number; name: string }[] = []) =>
  items.map(({ id, name }) => ({ value: String(id), label: name }));

const fieldsFor = (options: FilterOptions | null): FilterField[] => [
  { key: 'isbn', label: 'ISBN', testId: 'filter-isbn', options: plain(options?.isbn) },
  { key: 'title', label: 'Title', testId: 'filter-title', options: plain(options?.title) },
  { key: 'author', label: 'Author', testId: 'filter-author', options: plain(options?.author) },
  { key: 'genreId', label: 'Genre', testId: 'filter-genre', options: named(options?.genre) },
  {
    key: 'languageId',
    label: 'Language',
    testId: 'filter-language',
    options: named(options?.language),
  },
  { key: 'amount', label: 'Amount', testId: 'filter-amount', options: plain(options?.amount) },
  { key: 'stock', label: 'Stock', testId: 'filter-stock', options: plain(options?.stock) },
];

const FilterDialog = ({ filter, options, onApply, onCancel }: FilterDialogProps) => {
  const [draft, setDraft] = useState(filter);

  return (
    <Dialog open onClose={onCancel} fullWidth maxWidth="xs" data-testid="filter-dialog">
      <DialogTitle>Filter books</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {fieldsFor(options).map(({ key, label, testId, options: choices }) => (
            <Autocomplete
              key={key}
              options={choices}
              value={choices.find((option) => option.value === draft[key]) ?? null}
              onChange={(_, selected) =>
                setDraft((current) => ({ ...current, [key]: selected?.value ?? '' }))
              }
              getOptionLabel={(option) => option.label}
              getOptionKey={(option) => option.value}
              isOptionEqualToValue={(option, selected) => option.value === selected.value}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={label}
                  slotProps={{
                    ...params.slotProps,
                    htmlInput: { ...params.slotProps.htmlInput, 'data-testid': testId },
                  }}
                />
              )}
            />
          ))}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setDraft(EMPTY_FILTER)} data-testid="filter-clear">
          Clear
        </Button>
        <Button onClick={onCancel} data-testid="filter-cancel">
          Cancel
        </Button>
        <Button variant="contained" onClick={() => onApply(draft)} data-testid="filter-apply">
          Apply
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FilterDialog;
