import AttachMoneyOutlined from '@mui/icons-material/AttachMoneyOutlined';
import EmojiEventsOutlined from '@mui/icons-material/EmojiEventsOutlined';
import Inventory2Outlined from '@mui/icons-material/Inventory2Outlined';
import Box from '@mui/material/Box';
import { EmptyState, ErrorState } from '../../../shared/components/states';
import { StatusChip } from '../../../shared/components/status-chip';
import { formatMoney } from '../../../shared/format/money';
import { CategoryDonut } from '../components/CategoryDonut';
import { KpiCard } from '../components/KpiCard';
import { RecentProductsTable } from '../components/RecentProductsTable';
import { TopPricesChart } from '../components/TopPricesChart';
import { useDashboardMetrics } from '../hooks/useDashboardMetrics';

export function DashboardPage() {
  const { metrics, loading, error, reload, isEmpty } = useDashboardMetrics();

  if (error) {
    return <ErrorState title="No pudimos cargar el dashboard" error={error} onRetry={reload} />;
  }
  if (isEmpty) {
    return (
      <EmptyState
        title="Todavía no hay productos"
        description="Cuando se registren productos, aquí verás sus indicadores y la actividad reciente."
      />
    );
  }

  const { leaderCategory } = metrics;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box
        component="section"
        aria-label="Indicadores clave"
        aria-busy={loading}
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
          gap: 2.5,
        }}
      >
        <KpiCard
          title="Total de productos"
          value={metrics.totalProducts}
          detail="Productos registrados"
          icon={<Inventory2Outlined />}
          tone="ochre"
          loading={loading}
        />
        <KpiCard
          title="Valor total del inventario"
          value={formatMoney(metrics.inventoryValue)}
          detail="Suma de precios con decimales exactos"
          icon={<AttachMoneyOutlined />}
          tone="ink"
          loading={loading}
        />
        <KpiCard
          title="Categoría líder"
          value={leaderCategory?.category ?? '—'}
          detail={
            leaderCategory && (
              <StatusChip label={`Mayor stock: ${leaderCategory.stock} uds.`} variant="success" />
            )
          }
          icon={<EmojiEventsOutlined />}
          tone="sage"
          loading={loading}
        />
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
          gap: 2.5,
        }}
      >
        <CategoryDonut distribution={metrics.categoryDistribution} loading={loading} />
        <TopPricesChart products={metrics.topExpensive} loading={loading} />
      </Box>

      <RecentProductsTable products={metrics.latestCreated} loading={loading} />
    </Box>
  );
}
