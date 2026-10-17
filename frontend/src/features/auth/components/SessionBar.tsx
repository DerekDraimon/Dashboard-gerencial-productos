import LogoutRounded from '@mui/icons-material/LogoutRounded';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import type { AuthUser } from '../api/auth-api';
import { roleLabel } from '../role-label';

export interface SessionBarProps {
  user: AuthUser;
  compact: boolean;
  onLogout: () => void;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('');
}

export function SessionBar({ user, compact, onLogout }: SessionBarProps) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, ml: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
        <Box
          aria-hidden="true"
          sx={{
            width: 36,
            height: 36,
            flex: 'none',
            borderRadius: '50%',
            bgcolor: 'secondary.main',
            color: 'ink.main',
            display: 'grid',
            placeItems: 'center',
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          {initials(user.name)}
        </Box>
        <Box sx={{ display: { xs: 'none', sm: 'flex' }, flexDirection: 'column', minWidth: 0 }}>
          <Typography noWrap sx={{ fontSize: 14, fontWeight: 600 }}>
            {user.name}
          </Typography>
          <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
            {roleLabel(user.role)}
          </Typography>
        </Box>
      </Box>
      {compact ? (
        <IconButton aria-label="Cerrar sesión" onClick={onLogout} sx={{ color: 'ink.main' }}>
          <LogoutRounded />
        </IconButton>
      ) : (
        <Button
          variant="outlined"
          startIcon={<LogoutRounded />}
          onClick={onLogout}
          sx={{ px: 2, fontWeight: 600, color: 'ink.main', borderColor: 'ink.main' }}
        >
          Cerrar sesión
        </Button>
      )}
    </Box>
  );
}
