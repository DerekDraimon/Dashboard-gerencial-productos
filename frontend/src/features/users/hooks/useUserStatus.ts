import { useCallback, useState } from 'react';
import { ApiError } from '../../../shared/api/api-error';
import { useConfirm } from '../../../shared/components/confirm-dialog';
import { useNotify } from '../../../shared/feedback/use-notify';
import { setUserStatus, type User } from '../api/users-api';
import type { UseUsersResult } from './useUsers';

export const CANNOT_MODIFY_SELF_MESSAGE = 'No puedes inactivarte ni cambiar tu propio rol.';
const UNEXPECTED_ERROR = 'No se pudo cambiar el estado del usuario. Inténtalo de nuevo.';

export function useUserStatus({ updateLocally }: Pick<UseUsersResult, 'updateLocally'>) {
  const confirm = useConfirm();
  const notify = useNotify();
  const [savingIds, setSavingIds] = useState<ReadonlySet<string>>(new Set());

  const toggle = useCallback(
    async (user: User) => {
      const active = !user.active;
      if (!active) {
        const confirmed = await confirm({
          title: `¿Inactivar a ${user.name}?`,
          message:
            'No podrá iniciar sesión hasta que lo reactives. Su cuenta y sus datos se conservan.',
          confirmLabel: 'Inactivar',
        });
        if (!confirmed) return;
      }

      setSavingIds((current) => new Set(current).add(user.id));
      try {
        const saved = await setUserStatus(user.id, active);
        updateLocally(user.id, { active: saved.active });
        notify.success(active ? 'Usuario reactivado' : 'Usuario inactivado');
      } catch (error) {
        if (error instanceof ApiError && error.code === 'CANNOT_MODIFY_SELF') {
          notify.error(CANNOT_MODIFY_SELF_MESSAGE);
        } else {
          notify.error(error instanceof ApiError ? error.message : UNEXPECTED_ERROR);
        }
      } finally {
        setSavingIds((current) => {
          const next = new Set(current);
          next.delete(user.id);
          return next;
        });
      }
    },
    [confirm, notify, updateLocally],
  );

  return { toggle, isSaving: (id: string) => savingIds.has(id) };
}
