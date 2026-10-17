import ErrorOutlineOutlined from '@mui/icons-material/ErrorOutlineOutlined';
import Button from '@mui/material/Button';
import { ApiError } from '../../api/api-error';
import { StateLayout } from './StateLayout';

export interface ErrorStateProps {
  error: unknown;
  onRetry?: () => void;
  title?: string;
}

const NETWORK_MESSAGE =
  'No pudimos conectar con el servidor. Revisa tu conexión e intenta de nuevo.';
const DEFAULT_MESSAGE = 'Ocurrió un error inesperado. Inténtalo de nuevo.';

function errorMessage(error: unknown): string | null {
  if (!(error instanceof ApiError)) return DEFAULT_MESSAGE;
  if (error.code === 'REQUEST_CANCELED') return null;
  if (error.code === 'NETWORK_ERROR') return NETWORK_MESSAGE;
  return error.message || DEFAULT_MESSAGE;
}

export function ErrorState({ error, onRetry, title = 'Algo salió mal' }: ErrorStateProps) {
  const message = errorMessage(error);
  if (message === null) return null;

  return (
    <StateLayout
      role="alert"
      icon={<ErrorOutlineOutlined />}
      iconColors={{ bgcolor: '#F8E9E6', color: 'error.main' }}
      title={title}
      description={message}
      action={
        onRetry && (
          <Button
            variant="outlined"
            onClick={onRetry}
            sx={{ px: 2, color: 'text.primary', borderColor: 'text.primary' }}
          >
            Reintentar
          </Button>
        )
      }
    />
  );
}
