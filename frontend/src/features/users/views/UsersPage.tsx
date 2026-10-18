import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useEffect } from 'react';
import { ErrorState } from '../../../shared/components/states';
import { useNotify } from '../../../shared/feedback/use-notify';
import { useAuth } from '../../auth/context/use-auth';
import { UserFilters } from '../components/UserFilters';
import { UsersTable } from '../components/UsersTable';
import { useUserStatus } from '../hooks/useUserStatus';
import { useUsers } from '../hooks/useUsers';

const REFRESH_ERROR = 'No se pudo actualizar la lista de usuarios.';

export function UsersPage() {
  const { user } = useAuth();
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down('sm'), { noSsr: true });
  const notify = useNotify();
  const users = useUsers();
  const { toggle, isSaving } = useUserStatus(users);
  const { refreshError } = users;

  useEffect(() => {
    if (refreshError) notify.error(REFRESH_ERROR);
  }, [refreshError, notify]);

  // Wired by the create and edit dialogs.
  const openCreate = () => undefined;
  const openEdit = () => undefined;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        {isPhone ? (
          <IconButton
            aria-label="Nuevo usuario"
            onClick={openCreate}
            sx={{
              width: 44,
              height: 44,
              borderRadius: '10px',
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
            }}
          >
            <AddIcon />
          </IconButton>
        ) : (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openCreate}
            sx={{ px: 2.25, fontWeight: 700 }}
          >
            Nuevo usuario
          </Button>
        )}
      </Box>
      <UserFilters
        status={users.status}
        onStatusChange={users.setStatus}
        onClear={users.clearFilters}
      />
      {users.error ? (
        <ErrorState
          title="No pudimos cargar los usuarios"
          error={users.error}
          onRetry={users.reload}
        />
      ) : (
        <UsersTable
          rows={users.rows}
          total={users.total}
          loading={users.loading}
          pagination={users.pagination}
          emptyMessage={
            users.status === 'all' ? 'Todavía no hay usuarios' : 'No hay usuarios con ese estado'
          }
          currentUserId={user?.id}
          isSaving={isSaving}
          onToggleStatus={(target) => void toggle(target)}
          onEdit={openEdit}
        />
      )}
    </Box>
  );
}
