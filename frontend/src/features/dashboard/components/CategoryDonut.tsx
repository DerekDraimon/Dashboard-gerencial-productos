import Box from '@mui/material/Box';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import type { CategoryShare } from '../metrics/dashboard-metrics';
import { ChartCard } from './ChartCard';

const TITLE = 'Distribución por categoría';
const INK = '#24262B';
const SLICE_COLORS = [INK, '#D9A62E', '#9DB59F', '#6E7178', '#C9CCC4'] as const;
// Light swatches need an ink outline to stay visible on the white card.
const OUTLINED_COLORS = new Set(['#D9A62E', '#9DB59F', '#C9CCC4']);
const DONUT_SIZE = 180;

const percentFormatter = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 });
const formatPercent = (percent: number) => `${percentFormatter.format(percent)}%`;
const colorAt = (index: number) => SLICE_COLORS[index % SLICE_COLORS.length] ?? INK;

export interface CategoryDonutProps {
  distribution: CategoryShare[];
  loading?: boolean;
}

export function CategoryDonut({ distribution, loading = false }: CategoryDonutProps) {
  const summary = distribution
    .map(({ category, percent }) => `${category} ${formatPercent(percent)}`)
    .join(', ');

  return (
    <ChartCard
      title={TITLE}
      subtitle="Proporción de productos por categoría"
      loading={loading}
      height={DONUT_SIZE}
    >
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 3.5 }}>
        <Box
          role="img"
          aria-label={`${TITLE}: ${summary}`}
          sx={{ width: DONUT_SIZE, height: DONUT_SIZE, flexShrink: 0, mx: { xs: 'auto', sm: 0 } }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={distribution}
                dataKey="count"
                nameKey="category"
                innerRadius="58%"
                outerRadius="100%"
                stroke="none"
                isAnimationActive={false}
              >
                {distribution.map(({ category }, index) => (
                  <Cell key={category} fill={colorAt(index)} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </Box>
        <Box
          component="ul"
          aria-label="Leyenda de categorías"
          sx={{
            listStyle: 'none',
            m: 0,
            p: 0,
            flex: '1 1 160px',
            display: 'flex',
            flexDirection: 'column',
            gap: 1.25,
            fontSize: 13,
          }}
        >
          {distribution.map(({ category, percent }, index) => {
            const color = colorAt(index);
            return (
              <Box
                component="li"
                key={category}
                sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}
              >
                <Box
                  aria-hidden="true"
                  sx={{
                    width: 12,
                    height: 12,
                    flexShrink: 0,
                    borderRadius: '3px',
                    bgcolor: color,
                    boxShadow: OUTLINED_COLORS.has(color) ? `inset 0 0 0 1px ${INK}` : 'none',
                  }}
                />
                <Box component="span" sx={{ flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}>
                  {category}
                </Box>
                <Box component="span" sx={{ fontWeight: 600 }}>
                  {formatPercent(percent)}
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>
    </ChartCard>
  );
}
