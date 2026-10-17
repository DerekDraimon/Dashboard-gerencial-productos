import Inventory2Outlined from '@mui/icons-material/Inventory2Outlined';
import PeopleAltOutlined from '@mui/icons-material/PeopleAltOutlined';
import SpaceDashboardOutlined from '@mui/icons-material/SpaceDashboardOutlined';
import type { SvgIconComponent } from '@mui/icons-material';

export interface NavigationItem {
  path: string;
  label: string;
  title: string;
  subtitle: string;
  Icon: SvgIconComponent;
}

export const NAVIGATION_ITEMS: readonly NavigationItem[] = [
  {
    path: '/dashboard',
    label: 'Dashboard',
    title: 'Dashboard',
    subtitle: 'Resumen del inventario',
    Icon: SpaceDashboardOutlined,
  },
  {
    path: '/inventory',
    label: 'Inventario',
    title: 'Inventario',
    subtitle: 'Gestiona los productos de la tienda',
    Icon: Inventory2Outlined,
  },
  {
    path: '/users',
    label: 'Usuarios',
    title: 'Usuarios',
    subtitle: 'Administra quién accede y con qué rol',
    Icon: PeopleAltOutlined,
  },
];

export function findNavigationItem(pathname: string): NavigationItem | undefined {
  return NAVIGATION_ITEMS.find(
    (item) => pathname === item.path || pathname.startsWith(`${item.path}/`),
  );
}
