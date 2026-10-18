import Box from '@mui/material/Box';
import Switch from '@mui/material/Switch';
import { StatusChip } from '../../../shared/components/status-chip';
import type { User } from '../api/users-api';

export interface UserStatusSwitchProps {
  user: User;
  disabled: boolean;
  onToggle: (user: User) => void;
}

export function UserStatusSwitch({ user, disabled, onToggle }: UserStatusSwitchProps) {
  const label = `${user.active ? 'Inactivar' : 'Reactivar'} a ${user.name}`;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
      <Switch
        checked={user.active}
        disabled={disabled}
        onChange={() => onToggle(user)}
        slotProps={{ input: { role: 'switch', 'aria-label': label } }}
      />
      <StatusChip
        label={user.active ? 'Activo' : 'Inactivo'}
        variant={user.active ? 'success' : 'muted'}
      />
    </Box>
  );
}
