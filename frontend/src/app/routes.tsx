import type { ReactElement } from 'react';
import { Navigate, type RouteObject } from 'react-router-dom';
import { LoginPage } from '../features/auth/views/LoginPage';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { InventoryPage } from '../features/products/InventoryPage';
import { UsersPage } from '../features/users/UsersPage';
import { AppLayout } from '../shared/layout/AppLayout';
import { HOME_PATH, NAVIGATION_ITEMS, type NavigationId } from '../shared/layout/navigation';
import { NotFoundPage } from '../shared/pages/NotFoundPage';

const PAGES: Record<NavigationId, ReactElement> = {
  dashboard: <DashboardPage />,
  inventory: <InventoryPage />,
  users: <UsersPage />,
};

export const routes: RouteObject[] = [
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to={HOME_PATH} replace /> },
      ...NAVIGATION_ITEMS.map((item) => ({ path: item.path, element: PAGES[item.id] })),
    ],
  },
  { path: '*', element: <NotFoundPage /> },
];
