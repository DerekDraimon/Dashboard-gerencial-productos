import NativeSelect from '@mui/material/NativeSelect';
import OutlinedInput from '@mui/material/OutlinedInput';
import { useId } from 'react';
import { FilterBar, FilterField } from '../../../shared/components/filter-bar';
import type { UserStatusFilter } from '../hooks/useUsers';

export interface UserFiltersProps {
  status: UserStatusFilter;
  onStatusChange: (status: UserStatusFilter) => void;
  onClear: () => void;
}

const OPTIONS: { value: UserStatusFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: 'Activos' },
  { value: 'inactive', label: 'Inactivos' },
];

export function UserFilters({ status, onStatusChange, onClear }: UserFiltersProps) {
  const id = useId();
  return (
    <FilterBar onClear={onClear} canClear={status !== 'all'}>
      <FilterField label="Estado" htmlFor={id} flex="0 1 260px">
        <NativeSelect
          id={id}
          value={status}
          input={<OutlinedInput />}
          onChange={(event) => onStatusChange(event.target.value as UserStatusFilter)}
        >
          {OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </NativeSelect>
      </FilterField>
    </FilterBar>
  );
}
