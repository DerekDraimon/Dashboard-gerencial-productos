import VisibilityOffOutlined from '@mui/icons-material/VisibilityOffOutlined';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import { useEffect, useState } from 'react';
import { Controller, useForm, type FieldPath } from 'react-hook-form';
import { ApiError } from '../../../shared/api/api-error';
import type { UserRole } from '../../../shared/auth/user-role';
import { FormDialog } from '../../../shared/components/form-dialog';
import { ErrorState, LoadingState } from '../../../shared/components/states';
import { useNotify } from '../../../shared/feedback/use-notify';
import { applyValidationErrors } from '../../../shared/forms/validation-errors';
import { roleLabel } from '../../auth/role-label';
import { createUser, getUser, updateUser, type UpdateUserInput, type User } from '../api/users-api';
import { CANNOT_MODIFY_SELF_MESSAGE } from '../hooks/useUserStatus';

export interface UserFormValues {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export type UserFormDialogProps = {
  open: boolean;
  onClose: () => void;
  onSaved: (user: User) => void;
} & ({ mode: 'create' } | { mode: 'edit'; userId: string; currentUserId: string | undefined });

interface LoadedUser {
  key: string;
  user: User | null;
  error: unknown;
}

const EMPTY_VALUES: UserFormValues = { name: '', email: '', password: '', role: 'USER' };
const FIELDS = Object.keys(EMPTY_VALUES) as FieldPath<UserFormValues>[];
const ROLES: UserRole[] = ['ADMIN', 'USER'];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UNEXPECTED_ERROR = 'Ocurrió un error inesperado. Inténtalo de nuevo.';

function validateName(value: string) {
  const name = value.trim();
  if (name === '') return 'El nombre es obligatorio.';
  return name.length <= 100 || 'El nombre admite máximo 100 caracteres.';
}

function validateEmail(value: string) {
  const email = value.trim();
  if (email === '') return 'El correo es obligatorio.';
  return EMAIL_PATTERN.test(email) || 'Ingresa un correo válido.';
}

function validatePassword(value: string) {
  if (value === '') return 'La contraseña es obligatoria.';
  if (value.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
  // bcrypt ignores everything past 72 bytes, so the API rejects longer passwords. Bytes are not
  // characters (an emoji takes 4), so the message names no limit.
  const fits = new TextEncoder().encode(value).length <= 72;
  return fits || 'La contraseña es demasiado larga.';
}

function changedFields(values: UserFormValues, original: User): UpdateUserInput {
  const patch: UpdateUserInput = {};
  const name = values.name.trim();
  if (name !== original.name) patch.name = name;
  if (values.role !== original.role) patch.role = values.role;
  return patch;
}

export function UserFormDialog(props: UserFormDialogProps) {
  const { open, onClose, onSaved } = props;
  const userId = props.mode === 'edit' ? props.userId : null;
  const isSelf = props.mode === 'edit' && props.userId === props.currentUserId;
  const notify = useNotify();
  const [showPassword, setShowPassword] = useState(false);
  const [attempt, setAttempt] = useState(0);
  // Every opening gets its own load key, so a reopened dialog never shows the previous data.
  const [opening, setOpening] = useState({ open, count: 0 });
  if (opening.open !== open) {
    setOpening((current) => ({ open, count: open ? current.count + 1 : current.count }));
    if (open) setShowPassword(false);
  }
  const [loaded, setLoaded] = useState<LoadedUser>({ key: '', user: null, error: null });
  const loadKey = userId === null ? '' : `${userId}:${opening.count}:${attempt}`;
  // Closing keeps the same key, so the loaded form stays visible during the close animation.
  const current = loaded.key === loadKey;
  const original = current ? loaded.user : null;
  const loadError = current ? loaded.error : null;
  const ready = userId === null || original !== null;
  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<UserFormValues>({ defaultValues: EMPTY_VALUES });

  useEffect(() => {
    if (!open) return;
    if (userId === null) {
      reset(EMPTY_VALUES);
      return;
    }
    const controller = new AbortController();
    getUser(userId, { signal: controller.signal }).then(
      (user) => {
        if (controller.signal.aborted) return;
        reset({ ...EMPTY_VALUES, name: user.name, role: user.role });
        setLoaded({ key: loadKey, user, error: null });
      },
      (error: unknown) => {
        if (!controller.signal.aborted) setLoaded({ key: loadKey, user: null, error });
      },
    );
    return () => controller.abort();
  }, [open, userId, loadKey, reset]);

  async function save(values: UserFormValues): Promise<void> {
    if (userId === null) {
      const user = await createUser({
        name: values.name.trim(),
        email: values.email.trim().toLowerCase(),
        password: values.password,
        role: values.role,
      });
      notify.success('Usuario creado');
      onSaved(user);
    } else if (original) {
      const patch = changedFields(values, original);
      // Nothing changed: closing silently is the expected outcome, not an error.
      if (Object.keys(patch).length > 0) {
        onSaved(await updateUser(userId, patch));
        notify.success('Usuario actualizado');
      }
    }
    onClose();
  }

  const submit = handleSubmit(async (values) => {
    try {
      await save(values);
    } catch (error) {
      const code = error instanceof ApiError ? error.code : null;
      if (code === 'EMAIL_ALREADY_EXISTS') {
        setError('email', { message: 'Ya existe un usuario con este correo.' });
        return;
      }
      if (code === 'CANNOT_MODIFY_SELF') {
        notify.error(CANNOT_MODIFY_SELF_MESSAGE);
        return;
      }
      const unmatched = applyValidationErrors(error, FIELDS, setError);
      if (unmatched === null) {
        notify.error(error instanceof ApiError ? error.message : UNEXPECTED_ERROR);
      } else if (unmatched.length > 0) {
        notify.error(unmatched.join(' '));
      }
    }
  });

  function textField(
    name: 'name' | 'email' | 'password',
    validate: (value: string) => string | true,
  ) {
    const { ref, ...rest } = register(name, { validate });
    return {
      ...rest,
      inputRef: ref,
      error: Boolean(errors[name]),
      helperText: errors[name]?.message,
      fullWidth: true,
    };
  }

  const creating = userId === null;
  const password = creating ? textField('password', validatePassword) : null;

  return (
    <FormDialog
      open={open}
      title={creating ? 'Nuevo usuario' : 'Editar usuario'}
      subtitle={creating ? 'La cuenta queda activa al crearla.' : original?.email}
      submitLabel={creating ? 'Crear usuario' : 'Guardar cambios'}
      submitting={isSubmitting}
      onClose={onClose}
      onSubmit={(event) => {
        if (ready) void submit(event);
      }}
      maxWidth="xs"
    >
      {!ready &&
        (loadError ? (
          <ErrorState
            title="No pudimos cargar el usuario"
            error={loadError}
            onRetry={() => setAttempt((value) => value + 1)}
          />
        ) : (
          <LoadingState label="Cargando usuario…" />
        ))}
      {ready && (
        <Stack spacing={2.25} sx={{ pt: 1 }}>
          <TextField label="Nombre" autoComplete="off" {...textField('name', validateName)} />
          {creating && (
            <>
              <TextField
                label="Correo electrónico"
                type="email"
                autoComplete="off"
                {...textField('email', validateEmail)}
              />
              <TextField
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                {...password}
                helperText={password?.helperText ?? 'Mínimo 8 caracteres.'}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                          onClick={() => setShowPassword((value) => !value)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOffOutlined /> : <VisibilityOutlined />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </>
          )}
          <Box component="fieldset" sx={{ border: 0, m: 0, p: 0, minWidth: 0 }}>
            <Box component="legend" sx={{ fontSize: 13, fontWeight: 600, mb: 1, p: 0 }}>
              Rol
            </Box>
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <Box
                  sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1 }}
                >
                  {ROLES.map((role) => (
                    <Button
                      key={role}
                      variant={field.value === role ? 'contained' : 'outlined'}
                      aria-pressed={field.value === role}
                      disabled={isSelf}
                      onClick={() => field.onChange(role)}
                      sx={{ minHeight: 44, fontWeight: 700 }}
                    >
                      {roleLabel(role)}
                    </Button>
                  ))}
                </Box>
              )}
            />
          </Box>
        </Stack>
      )}
    </FormDialog>
  );
}
