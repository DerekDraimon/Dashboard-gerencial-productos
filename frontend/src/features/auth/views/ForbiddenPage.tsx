import LockOutlined from '@mui/icons-material/LockOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { Link as RouterLink } from 'react-router-dom';
import { HOME_PATH } from '../../../shared/layout/navigation';

export function ForbiddenPage() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 1.5,
        py: { xs: 6, md: 10 },
        px: 2,
      }}
    >
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          bgcolor: 'tint.danger',
          color: 'error.main',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <LockOutlined />
      </Box>
      <Typography component="h2" sx={{ fontSize: 20, fontWeight: 700 }}>
        No tienes permisos para ver esta sección
      </Typography>
      <Typography color="text.secondary" sx={{ maxWidth: 420 }}>
        Tu rol no tiene acceso a esta página. Si crees que es un error, contacta a un administrador.
      </Typography>
      <Button component={RouterLink} to={HOME_PATH} variant="contained" sx={{ mt: 1 }}>
        Volver al dashboard
      </Button>
    </Box>
  );
}
