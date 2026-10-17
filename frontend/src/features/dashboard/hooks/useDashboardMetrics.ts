import { useMemo } from 'react';
import { useAllProducts } from '../../products/hooks/useAllProducts';
import { computeDashboardMetrics, type DashboardMetrics } from '../metrics/dashboard-metrics';

export interface UseDashboardMetricsResult {
  metrics: DashboardMetrics;
  loading: boolean;
  error: unknown;
  reload: () => void;
  isEmpty: boolean;
}

export function useDashboardMetrics(): UseDashboardMetricsResult {
  const { products, loading, error, reload } = useAllProducts();
  const metrics = useMemo(() => computeDashboardMetrics(products), [products]);
  const isEmpty = !loading && !error && metrics.totalProducts === 0;

  return { metrics, loading, error, reload, isEmpty };
}
