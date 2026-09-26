import { NamedItem } from '@/common/types';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';

type NamedSelectProps = {
  label: string;
  testId: string;
  options: NamedItem[];
  value: NamedItem | null;
  onChange: (value: NamedItem | null) => void;
  error?: string;
};

const NamedSelect = ({ label, testId, options, value, onChange, error }: NamedSelectProps) => (
  <Autocomplete
    options={options}
    value={value}
    onChange={(_, selected) => onChange(selected)}
    getOptionLabel={(option) => option.name}
    isOptionEqualToValue={(option, selected) => option.id === selected.id}
    renderInput={(params) => (
      <TextField
        {...params}
        label={label}
        error={!!error}
        helperText={error}
        slotProps={{
          ...params.slotProps,
          htmlInput: { ...params.slotProps.htmlInput, 'data-testid': testId },
        }}
      />
    )}
  />
);

export default NamedSelect;
