import type { ReactElement } from 'react';
import { Navigate, type RouteObject } from 'react-router-dom';
import { LOGIN_PATH, ProtectedRoute } from '../features/auth/routes/ProtectedRoute';
import { PublicOnlyRoute } from '../features/auth/routes/PublicOnlyRoute';
import { RequireRole } from '../features/auth/routes/RequireRole';
import { lazyPage } from '../shared/components/route-error-boundary';
import { HOME_PATH, NAVIGATION_ITEMS, type NavigationId } from '../shared/layout/navigation';
import { SessionLayout } from './SessionLayout';

const LoginPage = lazyPage(() =>
  import('../features/auth/views/LoginPage').then((module) => module.LoginPage),
);
// Recharts only ships with the dashboard chunk, keeping it out of the initial bundle.
const DashboardPage = lazyPage(() =>
  import('../features/dashboard/views/DashboardPage').then((module) => module.DashboardPage),
);
const InventoryPage = lazyPage(() =>
  import('../features/products/views/InventoryPage').then((module) => module.InventoryPage),
);
const UsersPage = lazyPage(() =>
  import('../features/users/views/UsersPage').then((module) => module.UsersPage),
);
const NotFoundPage = lazyPage(() =>
  import('../shared/pages/NotFoundPage').then((module) => module.NotFoundPage),
);

const PAGES: Record<NavigationId, ReactElement> = {
  dashboard: <DashboardPage />,
  inventory: <InventoryPage />,
  users: <UsersPage />,
};

export const routes: RouteObject[] = [
  {
    element: <PublicOnlyRoute />,
    children: [{ path: LOGIN_PATH, element: <LoginPage /> }],
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: <SessionLayout />,
        children: [
          { index: true, element: <Navigate to={HOME_PATH} replace /> },
          ...NAVIGATION_ITEMS.map((item) => ({
            path: item.path,
            element: item.roles ? (
              <RequireRole roles={item.roles}>{PAGES[item.id]}</RequireRole>
            ) : (
              PAGES[item.id]
            ),
          })),
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
];
