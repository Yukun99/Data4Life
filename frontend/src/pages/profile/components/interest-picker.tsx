import { NamedItem } from '@/pages/profile/hooks/use-interests';
import Autocomplete from '@mui/material/Autocomplete';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';

type InterestPickerProps = {
  label: string;
  testId: string;
  options: NamedItem[];
  value: NamedItem[];
  onChange: (value: NamedItem[]) => void;
  full: boolean;
};

const InterestPicker = ({ label, testId, options, value, onChange, full }: InterestPickerProps) => (
  <Stack spacing={1}>
    <Autocomplete
      multiple
      filterSelectedOptions
      options={options}
      value={value}
      onChange={(_, selected) => onChange(selected)}
      getOptionLabel={(option) => option.name}
      isOptionEqualToValue={(option, selected) => option.id === selected.id}
      getOptionDisabled={() => full}
      renderValue={() => null}
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
    {value.length > 0 && (
      <Stack direction="row" useFlexGap sx={{ flexWrap: 'wrap', gap: 1 }}>
        {value.map((item) => (
          <Chip
            key={item.id}
            label={item.name}
            onDelete={() => onChange(value.filter(({ id }) => id !== item.id))}
            data-testid={`interests-selected-${item.name}`}
          />
        ))}
      </Stack>
    )}
  </Stack>
);

export default InterestPicker;
