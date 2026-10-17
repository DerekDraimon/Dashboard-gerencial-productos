import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/use-auth';
import { redirectTarget } from './redirect-target';

export function PublicOnlyRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'authenticated') {
    return <Navigate to={redirectTarget(location.state)} replace />;
  }
  return <Outlet />;
}
