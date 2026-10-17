import Inventory2Outlined from '@mui/icons-material/Inventory2Outlined';
import PeopleAltOutlined from '@mui/icons-material/PeopleAltOutlined';
import SpaceDashboardOutlined from '@mui/icons-material/SpaceDashboardOutlined';
import type { SvgIconComponent } from '@mui/icons-material';
import type { UserRole } from '../auth/user-role';

export type NavigationId = 'dashboard' | 'inventory' | 'users';

export interface NavigationItem {
  id: NavigationId;
  path: string;
  label: string;
  title: string;
  subtitle: string;
  Icon: SvgIconComponent;
  roles?: readonly UserRole[];
}

export const HOME_PATH = '/dashboard';

export const NAVIGATION_ITEMS: readonly NavigationItem[] = [
  {
    id: 'dashboard',
    path: HOME_PATH,
    label: 'Dashboard',
    title: 'Dashboard',
    subtitle: 'Resumen del inventario',
    Icon: SpaceDashboardOutlined,
  },
  {
    id: 'inventory',
    path: '/inventory',
    label: 'Inventario',
    title: 'Inventario',
    subtitle: 'Gestiona los productos de la tienda',
    Icon: Inventory2Outlined,
  },
  {
    id: 'users',
    path: '/users',
    label: 'Usuarios',
    title: 'Usuarios',
    subtitle: 'Administra quién accede y con qué rol',
    Icon: PeopleAltOutlined,
    roles: ['ADMIN'],
  },
];

export function canOpen(item: NavigationItem, role: UserRole | undefined): boolean {
  return !item.roles || (role !== undefined && item.roles.includes(role));
}

export function findNavigationItem(pathname: string): NavigationItem | undefined {
  return NAVIGATION_ITEMS.find(
    (item) => pathname === item.path || pathname.startsWith(`${item.path}/`),
  );
}
