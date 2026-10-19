import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Stack from '@mui/material/Stack';
import { useEffect, useState } from 'react';
import { ErrorState } from '../../../shared/components/states';
import { useNotify } from '../../../shared/feedback/use-notify';
import { useAuth } from '../../auth/context/use-auth';
import { UserFilters } from '../components/UserFilters';
import { UserFormDialog } from '../components/UserFormDialog';
import type { User } from '../api/users-api';
import { UsersTable } from '../components/UsersTable';
import { useUserStatus } from '../hooks/useUserStatus';
import { useUsers } from '../hooks/useUsers';

const REFRESH_ERROR = 'No se pudo actualizar la lista de usuarios.';

export function UsersPage() {
  const { user, refreshUser } = useAuth();
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down('sm'), { noSsr: true });
  const notify = useNotify();
  const users = useUsers();
  const { toggle, isSaving } = useUserStatus(users);
  const { refreshError } = users;

  useEffect(() => {
    if (refreshError) notify.error(REFRESH_ERROR);
  }, [refreshError, notify]);

  const [creating, setCreating] = useState(false);
  const openCreate = () => setCreating(true);
  // The id outlives `open` so the dialog keeps its content during the closing transition.
  const [editing, setEditing] = useState({ id: '', open: false });
  const openEdit = (target: User) => setEditing({ id: target.id, open: true });

  function handleEdited(saved: User) {
    users.updateLocally(saved.id, saved);
    users.refresh();
    if (saved.id === user?.id) void refreshUser();
  }

  return (
    <Stack spacing={2.5}>
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
      <UserFormDialog
        open={creating}
        mode="create"
        onClose={() => setCreating(false)}
        onSaved={() => users.refresh()}
      />
      <UserFormDialog
        open={editing.open}
        mode="edit"
        userId={editing.id}
        currentUserId={user?.id}
        onClose={() => setEditing((current) => ({ ...current, open: false }))}
        onSaved={handleEdited}
      />
    </Stack>
  );
}
