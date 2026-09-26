import { FilterField } from '@/common/components/data-table/types';
import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useState } from 'react';

type FilterDialogProps<K extends string> = {
  title: string;
  fields: FilterField<K>[];
  filter: Record<K, string>;
  empty: Record<K, string>;
  onApply: (filter: Record<K, string>) => void;
  onCancel: () => void;
};

const FilterDialog = <K extends string>({
  title,
  fields,
  filter,
  empty,
  onApply,
  onCancel,
}: FilterDialogProps<K>) => {
  const [draft, setDraft] = useState(filter);

  const update = (key: K, value: string) =>
    setDraft((current) => {
      const next = { ...current };
      next[key] = value;
      return next;
    });

  return (
    <Dialog open onClose={onCancel} fullWidth maxWidth="xs" data-testid="filter-dialog">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {fields.map(({ key, label, testId, options }) => (
            <Autocomplete
              key={key}
              options={options}
              value={options.find((option) => option.value === draft[key]) ?? null}
              onChange={(_, selected) => update(key, selected?.value ?? '')}
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
        <Button onClick={() => setDraft(empty)} data-testid="filter-clear">
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
