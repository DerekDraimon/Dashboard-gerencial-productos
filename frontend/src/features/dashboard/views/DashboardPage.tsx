import AttachMoneyOutlined from '@mui/icons-material/AttachMoneyOutlined';
import EmojiEventsOutlined from '@mui/icons-material/EmojiEventsOutlined';
import Inventory2Outlined from '@mui/icons-material/Inventory2Outlined';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import { EmptyState, ErrorState } from '../../../shared/components/states';
import { StatusChip } from '../../../shared/components/status-chip';
import { formatMoney } from '../../../shared/format/money';
import { CategoryDonut } from '../components/CategoryDonut';
import { KpiCard } from '../components/KpiCard';
import { RecentProductsTable } from '../components/RecentProductsTable';
import { TopPricesChart } from '../components/TopPricesChart';
import { useDashboardMetrics } from '../hooks/useDashboardMetrics';

// The card fills its cell, so every card in a row takes the height of the tallest one.
const CELL_SX = { display: 'flex', minWidth: 0, '& > *': { flexGrow: 1, minWidth: 0 } };

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
    <Stack spacing={3}>
      <Grid
        container
        component="section"
        aria-label="Indicadores clave"
        aria-busy={loading}
        spacing={2.5}
      >
        <Grid size={{ xs: 12, md: 4 }} sx={CELL_SX}>
          <KpiCard
            title="Total de productos"
            value={metrics.totalProducts}
            detail="Productos registrados"
            icon={<Inventory2Outlined />}
            tone="ochre"
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }} sx={CELL_SX}>
          <KpiCard
            title="Valor total del inventario"
            value={formatMoney(metrics.inventoryValue)}
            detail="Suma de precios con decimales exactos"
            icon={<AttachMoneyOutlined />}
            tone="ink"
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }} sx={CELL_SX}>
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
        </Grid>
      </Grid>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 6 }} sx={CELL_SX}>
          <CategoryDonut distribution={metrics.categoryDistribution} loading={loading} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }} sx={CELL_SX}>
          <TopPricesChart products={metrics.topExpensive} loading={loading} />
        </Grid>
      </Grid>

      <RecentProductsTable products={metrics.latestCreated} loading={loading} />
    </Stack>
  );
}
