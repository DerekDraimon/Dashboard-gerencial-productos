import Box from '@mui/material/Box';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { formatMoney } from '../../../shared/format/money';
import type { Product } from '../../products/api/products-api';
import { ChartCard } from './ChartCard';

const TITLE = 'Top 5 productos más caros';
const INK = '#24262B';
const TRACK = '#ECEDE8';
const CHART_HEIGHT = 220;
// Below lg the chart shares a narrow half row, so titles get a shorter axis.
const TITLE_AXIS = {
  narrow: { width: 120, maxLength: 16 },
  wide: { width: 180, maxLength: 24 },
} as const;

const truncate = (title: string, maxLength: number) =>
  title.length > maxLength ? `${title.slice(0, maxLength - 1)}…` : title;

const axisProps = { type: 'category', axisLine: false, tickLine: false } as const;

export interface TopPricesChartProps {
  products: Product[];
  loading?: boolean;
}

export function TopPricesChart({ products, loading = false }: TopPricesChartProps) {
  const theme = useTheme();
  const titleAxis = useMediaQuery(theme.breakpoints.up('lg'), { noSsr: true })
    ? TITLE_AXIS.wide
    : TITLE_AXIS.narrow;
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
              width={titleAxis.width}
              tickFormatter={(title: string) => truncate(title, titleAxis.maxLength)}
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
