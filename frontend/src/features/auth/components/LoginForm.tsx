import VisibilityOffOutlined from '@mui/icons-material/VisibilityOffOutlined';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ApiError } from '../../../shared/api/api-error';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginFormProps {
  onSubmit: (credentials: LoginCredentials) => void;
  submitting: boolean;
  error?: unknown;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UNEXPECTED_MESSAGE = 'Ocurrió un error inesperado. Inténtalo de nuevo.';

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: 'Correo o contraseña incorrectos.',
  USER_INACTIVE: 'Tu cuenta está inactiva. Contacta a un administrador.',
  TOO_MANY_REQUESTS: 'Demasiados intentos. Espera unos minutos e intenta de nuevo.',
};

function errorMessage(error: unknown): string | null {
  if (!error) return null;
  if (!(error instanceof ApiError)) return UNEXPECTED_MESSAGE;
  if (error.code === 'REQUEST_CANCELED') return null;
  if (error.code === 'NETWORK_ERROR') return error.message;
  return ERROR_MESSAGES[error.code] ?? UNEXPECTED_MESSAGE;
}

export function LoginForm({ onSubmit, submitting, error }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginCredentials>({ defaultValues: { email: '', password: '' } });

  const { ref: emailRef, ...emailField } = register('email', {
    validate: {
      required: (value) => value.trim() !== '' || 'El correo es obligatorio.',
      format: (value) => EMAIL_PATTERN.test(value.trim()) || 'Ingresa un correo válido.',
    },
  });
  const { ref: passwordRef, ...passwordField } = register('password', {
    required: 'La contraseña es obligatoria.',
  });
  const message = errorMessage(error);

  return (
    <Box
      component="form"
      noValidate
      onSubmit={handleSubmit(({ email, password }) => onSubmit({ email: email.trim(), password }))}
      sx={{
        width: '100%',
        maxWidth: 400,
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
        borderRadius: 4,
        p: { xs: 3, sm: 4 },
        display: 'flex',
        flexDirection: 'column',
        gap: 2.5,
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
        <Typography component="h1" sx={{ fontSize: 24, fontWeight: 700 }}>
          Iniciar sesión
        </Typography>
        <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>
          Ingresa con tu correo y contraseña.
        </Typography>
      </Box>
      {message && <Alert severity="error">{message}</Alert>}
      <TextField
        {...emailField}
        inputRef={emailRef}
        label="Correo electrónico"
        type="email"
        autoComplete="email"
        error={Boolean(errors.email)}
        helperText={errors.email?.message}
        fullWidth
      />
      <TextField
        {...passwordField}
        inputRef={passwordRef}
        label="Contraseña"
        type={showPassword ? 'text' : 'password'}
        autoComplete="current-password"
        error={Boolean(errors.password)}
        helperText={errors.password?.message}
        fullWidth
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  edge="end"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  onClick={() => setShowPassword((shown) => !shown)}
                >
                  {showPassword ? <VisibilityOffOutlined /> : <VisibilityOutlined />}
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />
      <Button
        type="submit"
        variant="contained"
        size="large"
        loading={submitting}
        sx={{ minHeight: 48, fontWeight: 700 }}
      >
        Entrar
      </Button>
    </Box>
  );
}
