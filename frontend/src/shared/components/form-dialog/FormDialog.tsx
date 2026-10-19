import CloseIcon from '@mui/icons-material/Close';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog, { type DialogProps } from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Stack from '@mui/material/Stack';
import type { FormEvent, ReactNode } from 'react';

export interface FormDialogProps {
  open: boolean;
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  submitLabel?: string;
  cancelLabel?: string;
  submitting?: boolean;
  maxWidth?: DialogProps['maxWidth'];
}

const SECTION_PADDING = { px: { xs: 2, sm: 3.5 } };

export function FormDialog({
  open,
  title,
  subtitle,
  children,
  onClose,
  onSubmit,
  submitLabel = 'Guardar',
  cancelLabel = 'Cancelar',
  submitting = false,
  maxWidth = 'sm',
}: FormDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  function handleClose() {
    if (!submitting) onClose();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!submitting) onSubmit(event);
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullScreen={fullScreen}
      fullWidth
      maxWidth={maxWidth}
      slotProps={{ paper: { sx: { borderRadius: fullScreen ? 0 : '16px' } } }}
    >
      <Box
        component="form"
        noValidate
        onSubmit={handleSubmit}
        sx={{ display: 'flex', flexDirection: 'column', flex: '1 1 auto', minHeight: 0 }}
      >
        <Box
          sx={{
            ...SECTION_PADDING,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 2,
            py: 3,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Stack spacing={0.5}>
            <DialogTitle sx={{ p: 0, fontSize: 20, fontWeight: 700 }}>{title}</DialogTitle>
            {subtitle && (
              <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{subtitle}</Typography>
            )}
          </Stack>
          <IconButton aria-label="Cerrar" onClick={handleClose} disabled={submitting}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        <DialogContent sx={{ ...SECTION_PADDING, py: 3 }}>{children}</DialogContent>
        <DialogActions
          sx={{
            ...SECTION_PADDING,
            py: 2.25,
            gap: 1,
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Button
            variant="outlined"
            onClick={handleClose}
            disabled={submitting}
            sx={{ px: 2, color: 'text.primary', borderColor: 'text.primary' }}
          >
            {cancelLabel}
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : undefined}
            sx={{ px: 2.25, fontWeight: 700 }}
          >
            {submitLabel}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
