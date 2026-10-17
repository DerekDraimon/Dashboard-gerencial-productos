import Typography from '@mui/material/Typography';
import { AppProviders } from './providers';

export function App() {
  return (
    <AppProviders>
      <main>
        <Typography variant="h4" component="h1">
          Dashboard gerencial
        </Typography>
      </main>
    </AppProviders>
  );
}
