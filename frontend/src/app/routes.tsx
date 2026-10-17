import { Navigate, type RouteObject } from 'react-router-dom';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { InventoryPage } from '../features/products/InventoryPage';
import { UsersPage } from '../features/users/UsersPage';
import { AppLayout } from '../shared/layout/AppLayout';
import { NotFoundPage } from '../shared/pages/NotFoundPage';

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'inventory', element: <InventoryPage /> },
      { path: 'users', element: <UsersPage /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
];
