import SearchIcon from '@mui/icons-material/Search';
import FormHelperText from '@mui/material/FormHelperText';
import InputAdornment from '@mui/material/InputAdornment';
import OutlinedInput from '@mui/material/OutlinedInput';
import { useId } from 'react';
import { FilterBar, FilterField } from '../../../shared/components/filter-bar';
import type { ProductFilters as Filters } from '../hooks/useProducts';

export interface ProductFiltersProps {
  filters: Filters;
  dateRangeError: boolean;
  onSearchChange: (search: string) => void;
  onFromChange: (from: string) => void;
  onToChange: (to: string) => void;
  onClear: () => void;
}

const DATE_RANGE_ERROR = 'La fecha inicial no puede ser posterior a la final';

export function ProductFilters({
  filters,
  dateRangeError,
  onSearchChange,
  onFromChange,
  onToChange,
  onClear,
}: ProductFiltersProps) {
  const id = useId();
  const hasFilters = Object.values(filters).some((value) => value !== '');

  return (
    <FilterBar onClear={onClear} canClear={hasFilters}>
      <FilterField label="Buscar por título" htmlFor={`${id}-search`} flex="2 1 240px">
        <OutlinedInput
          id={`${id}-search`}
          type="search"
          placeholder="Ej. teclado"
          value={filters.search}
          onChange={(event) => onSearchChange(event.target.value)}
          startAdornment={
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          }
        />
      </FilterField>
      <FilterField label="Desde" htmlFor={`${id}-from`}>
        <OutlinedInput
          id={`${id}-from`}
          type="date"
          value={filters.from}
          error={dateRangeError}
          inputProps={{ 'aria-describedby': dateRangeError ? `${id}-range` : undefined }}
          onChange={(event) => onFromChange(event.target.value)}
        />
        {dateRangeError && (
          <FormHelperText id={`${id}-range`} error sx={{ mx: 0 }}>
            {DATE_RANGE_ERROR}
          </FormHelperText>
        )}
      </FilterField>
      <FilterField label="Hasta" htmlFor={`${id}-to`}>
        <OutlinedInput
          id={`${id}-to`}
          type="date"
          value={filters.to}
          onChange={(event) => onToChange(event.target.value)}
        />
      </FilterField>
    </FilterBar>
  );
}
