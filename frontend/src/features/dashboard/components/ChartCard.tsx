import Card from '@mui/material/Card';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import { useId, type ReactNode } from 'react';

export interface ChartCardProps {
  title: string;
  subtitle: string;
  loading: boolean;
  /** Fixed body height so the skeleton and the chart take the same space. */
  height: number;
  children: ReactNode;
}

export function ChartCard({ title, subtitle, loading, height, children }: ChartCardProps) {
  const titleId = useId();

  return (
    <Card
      component="section"
      aria-labelledby={titleId}
      aria-busy={loading}
      sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}
    >
      <div>
        <Typography id={titleId} component="h2" sx={{ fontSize: 16, fontWeight: 700 }}>
          {title}
        </Typography>
        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{subtitle}</Typography>
      </div>
      {loading ? (
        <Skeleton variant="rounded" height={height} sx={{ borderRadius: '10px' }} />
      ) : (
        children
      )}
    </Card>
  );
}
