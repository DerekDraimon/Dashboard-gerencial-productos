import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlineOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { useId, type ReactNode } from 'react';

export type ConfirmDialogVariant = 'default' | 'danger';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmDialogVariant;
  loading?: boolean;
  icon?: ReactNode;
}

const iconColors: Record<ConfirmDialogVariant, { bgcolor: string; color: string }> = {
  default: { bgcolor: '#E6EDE6', color: 'text.primary' },
  danger: { bgcolor: '#F8E9E6', color: 'error.main' },
};

export function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'default',
  loading = false,
  icon = <ErrorOutlineIcon />,
}: ConfirmDialogProps) {
  const messageId = useId();

  function handleCancel() {
    if (!loading) onCancel();
  }

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      role="alertdialog"
      aria-describedby={messageId}
      fullWidth
      maxWidth="xs"
      slotProps={{
        paper: {
          sx: { borderRadius: '16px', p: { xs: 2.5, sm: 3.5 }, gap: 2.5, m: 2 },
        },
      }}
    >
      <Box
        sx={{
          ...iconColors[variant],
          width: 48,
          height: 48,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <DialogTitle sx={{ p: 0, fontSize: 20, fontWeight: 700 }}>{title}</DialogTitle>
        <DialogContentText
          id={messageId}
          component="div"
          sx={{ fontSize: 14, lineHeight: 1.55, color: '#3A3D43' }}
        >
          {message}
        </DialogContentText>
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 1 }}>
        <Button
          variant="outlined"
          onClick={handleCancel}
          disabled={loading}
          sx={{ px: 2, color: 'text.primary', borderColor: 'text.primary' }}
        >
          {cancelLabel}
        </Button>
        <Button
          variant="contained"
          color={variant === 'danger' ? 'error' : 'primary'}
          onClick={onConfirm}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
          sx={{ px: 2.25, fontWeight: 700 }}
        >
          {confirmLabel}
        </Button>
      </Box>
    </Dialog>
  );
}
