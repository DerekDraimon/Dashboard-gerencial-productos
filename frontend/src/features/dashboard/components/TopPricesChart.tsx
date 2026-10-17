import Box from '@mui/material/Box';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { formatMoney } from '../../../shared/format/money';
import type { Product } from '../../products/api/products-api';
import { ChartCard } from './ChartCard';

const TITLE = 'Top 5 productos más caros';
const INK = '#24262B';
const TRACK = '#ECEDE8';
const CHART_HEIGHT = 220;
const MAX_TITLE_LENGTH = 16;

const truncate = (title: string) =>
  title.length > MAX_TITLE_LENGTH ? `${title.slice(0, MAX_TITLE_LENGTH - 1)}…` : title;

const axisProps = { type: 'category', axisLine: false, tickLine: false } as const;

export interface TopPricesChartProps {
  products: Product[];
  loading?: boolean;
}

export function TopPricesChart({ products, loading = false }: TopPricesChartProps) {
  const bars = products.map(({ id, title, price }) => ({
    id,
    title,
    price,
    priceLabel: formatMoney(price),
  }));
  const summary = bars.map(({ title, priceLabel }) => `${title} ${priceLabel}`).join(', ');

  return (
    <ChartCard title={TITLE} subtitle="Precio por producto" loading={loading} height={CHART_HEIGHT}>
      <Box
        role="img"
        aria-label={`${TITLE}: ${summary}`}
        sx={{ height: CHART_HEIGHT, minWidth: 0 }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={bars} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <XAxis type="number" hide domain={[0, 'dataMax']} />
            <YAxis
              {...axisProps}
              yAxisId="title"
              dataKey="title"
              width={120}
              tickFormatter={truncate}
              tick={{ fontSize: 13, fill: '#3A3D43' }}
            />
            <YAxis
              {...axisProps}
              yAxisId="price"
              dataKey="priceLabel"
              orientation="right"
              width={100}
              tick={{ fontSize: 13, fontWeight: 600, fill: INK }}
            />
            <Bar
              yAxisId="title"
              dataKey="price"
              fill={INK}
              barSize={14}
              radius={7}
              background={{ fill: TRACK, radius: 7 }}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </ChartCard>
  );
}
