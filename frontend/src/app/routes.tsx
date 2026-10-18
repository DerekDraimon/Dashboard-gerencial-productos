import type { ReactElement } from 'react';
import { Navigate, type RouteObject } from 'react-router-dom';
import { LOGIN_PATH, ProtectedRoute } from '../features/auth/routes/ProtectedRoute';
import { PublicOnlyRoute } from '../features/auth/routes/PublicOnlyRoute';
import { RequireRole } from '../features/auth/routes/RequireRole';
import { LoginPage } from '../features/auth/views/LoginPage';
import { LazyDashboardPage } from '../features/dashboard/views/LazyDashboardPage';
import { InventoryPage } from '../features/products/views/InventoryPage';
import { UsersPage } from '../features/users/views/UsersPage';
import { HOME_PATH, NAVIGATION_ITEMS, type NavigationId } from '../shared/layout/navigation';
import { NotFoundPage } from '../shared/pages/NotFoundPage';
import { SessionLayout } from './SessionLayout';

const PAGES: Record<NavigationId, ReactElement> = {
  dashboard: <LazyDashboardPage />,
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
