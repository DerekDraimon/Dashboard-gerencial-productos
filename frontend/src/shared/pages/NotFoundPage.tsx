import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { Link as RouterLink } from 'react-router-dom';
import { HOME_PATH } from '../layout/navigation';

export function NotFoundPage() {
  return (
    <Box
      component="main"
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        px: 2,
        textAlign: 'center',
        bgcolor: 'background.default',
      }}
    >
      <Typography sx={{ fontSize: { xs: 56, md: 72 }, fontWeight: 700, lineHeight: 1 }}>
        404
      </Typography>
      <Typography variant="h4" component="h1">
        Página no encontrada
      </Typography>
      <Typography color="text.secondary">La página que buscas no existe o fue movida.</Typography>
      <Button component={RouterLink} to={HOME_PATH} variant="contained">
        Volver al dashboard
      </Button>
    </Box>
  );
}
