import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/use-auth';

export const LOGIN_PATH = '/login';

export function ProtectedRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status !== 'authenticated') {
    return <Navigate to={LOGIN_PATH} replace state={{ from: location }} />;
  }
  return <Outlet />;
}
