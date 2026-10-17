import { lazy, Suspense } from 'react';
import { LoadingState } from '../../../shared/components/states';

// Recharts only ships with the dashboard chunk, keeping it out of the initial bundle.
const DashboardPage = lazy(() =>
  import('./DashboardPage').then(({ DashboardPage }) => ({ default: DashboardPage })),
);

export function LazyDashboardPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <DashboardPage />
    </Suspense>
  );
}
