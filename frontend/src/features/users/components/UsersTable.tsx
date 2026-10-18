import EditOutlined from '@mui/icons-material/EditOutlined';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import {
  DataTable,
  TablePaginationFooter,
  type DataTableColumn,
} from '../../../shared/components/data-table';
import { StatusChip } from '../../../shared/components/status-chip';
import type { Pagination } from '../../../shared/hooks';
import { roleLabel } from '../../auth/role-label';
import type { User } from '../api/users-api';
import { UserStatusSwitch } from './UserStatusSwitch';

export interface UsersTableProps {
  rows: User[];
  total: number;
  loading: boolean;
  pagination: Pick<Pagination, 'offset' | 'limit' | 'setOffset' | 'setLimit'>;
  emptyMessage: string;
  currentUserId: string | undefined;
  isSaving: (id: string) => boolean;
  onToggleStatus: (user: User) => void;
  onEdit: (user: User) => void;
}

export function UsersTable({
  rows,
  total,
  loading,
  pagination,
  emptyMessage,
  currentUserId,
  isSaving,
  onToggleStatus,
  onEdit,
}: UsersTableProps) {
  const columns: DataTableColumn<User>[] = [
    {
      id: 'name',
      header: 'Nombre',
      render: ({ id, name }) => (
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Box component="span" sx={{ fontWeight: 600 }}>
            {name}
          </Box>
          {id === currentUserId && (
            <Box component="span" sx={{ fontSize: 12, color: 'text.secondary' }}>
              Tú · no puedes inactivarte ni cambiar tu rol
            </Box>
          )}
        </Box>
      ),
    },
    {
      id: 'email',
      header: 'Email',
      render: ({ email }) => (
        <Box component="span" sx={{ color: 'text.secondary' }}>
          {email}
        </Box>
      ),
    },
    {
      id: 'role',
      header: 'Rol',
      render: ({ role }) => (
        <StatusChip label={roleLabel(role)} variant={role === 'ADMIN' ? 'strong' : 'neutral'} />
      ),
    },
    {
      id: 'status',
      header: 'Estado',
      render: (user) => (
        <UserStatusSwitch
          user={user}
          disabled={user.id === currentUserId || isSaving(user.id)}
          onToggle={onToggleStatus}
        />
      ),
    },
    {
      id: 'actions',
      header: 'Acciones',
      align: 'right',
      render: (user) => (
        <IconButton
          aria-label={`Editar ${user.name}`}
          onClick={() => onEdit(user)}
          sx={{ width: 44, height: 44, borderRadius: '10px' }}
        >
          <EditOutlined fontSize="small" />
        </IconButton>
      ),
    },
  ];

  return (
    <DataTable
      ariaLabel="Usuarios"
      columns={columns}
      rows={rows}
      loading={loading}
      emptyMessage={emptyMessage}
      minWidth={760}
      getRowSx={(user) => (user.active ? undefined : { opacity: 0.7 })}
      footer={
        <TablePaginationFooter
          offset={pagination.offset}
          limit={pagination.limit}
          total={total}
          onOffsetChange={pagination.setOffset}
          onLimitChange={pagination.setLimit}
        />
      }
    />
  );
}
