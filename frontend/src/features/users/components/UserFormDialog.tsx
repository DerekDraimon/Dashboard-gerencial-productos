import VisibilityOffOutlined from '@mui/icons-material/VisibilityOffOutlined';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import { useEffect, useState } from 'react';
import { Controller, useForm, type FieldPath } from 'react-hook-form';
import { ApiError } from '../../../shared/api/api-error';
import type { UserRole } from '../../../shared/auth/user-role';
import { FormDialog } from '../../../shared/components/form-dialog';
import { useNotify } from '../../../shared/feedback/use-notify';
import { applyValidationErrors } from '../../../shared/forms/validation-errors';
import { roleLabel } from '../../auth/role-label';
import { createUser, type User } from '../api/users-api';

export interface UserFormValues {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface UserFormDialogProps {
  open: boolean;
  mode: 'create';
  onClose: () => void;
  onSaved: (user: User) => void;
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
  // bcrypt ignores everything past 72 bytes, so the API rejects longer passwords.
  return new TextEncoder().encode(value).length <= 72 || 'La contraseña admite máximo 72 bytes.';
}

export function UserFormDialog({ open, onClose, onSaved }: UserFormDialogProps) {
  const notify = useNotify();
  const [showPassword, setShowPassword] = useState(false);
  const [wasOpen, setWasOpen] = useState(open);
  if (wasOpen !== open) {
    setWasOpen(open);
    if (open) setShowPassword(false);
  }
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
    reset(EMPTY_VALUES);
  }, [open, reset]);

  const submit = handleSubmit(async (values) => {
    try {
      const user = await createUser({
        name: values.name.trim(),
        email: values.email.trim().toLowerCase(),
        password: values.password,
        role: values.role,
      });
      notify.success('Usuario creado');
      onSaved(user);
      onClose();
    } catch (error) {
      if (error instanceof ApiError && error.code === 'EMAIL_ALREADY_EXISTS') {
        setError('email', { message: 'Ya existe un usuario con este correo.' });
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

  const password = textField('password', validatePassword);

  return (
    <FormDialog
      open={open}
      title="Nuevo usuario"
      subtitle="La cuenta queda activa al crearla."
      submitLabel="Crear usuario"
      submitting={isSubmitting}
      onClose={onClose}
      onSubmit={(event) => void submit(event)}
      maxWidth="xs"
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.25, pt: 1 }}>
        <TextField label="Nombre" autoComplete="off" {...textField('name', validateName)} />
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
          helperText={password.helperText ?? 'Mínimo 8 caracteres.'}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    onClick={() => setShowPassword((current) => !current)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOffOutlined /> : <VisibilityOutlined />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />
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
      </Box>
    </FormDialog>
  );
}
