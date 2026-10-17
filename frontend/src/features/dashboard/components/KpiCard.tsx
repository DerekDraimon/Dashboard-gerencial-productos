import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import { useId, type ReactNode } from 'react';

export type KpiTone = 'ochre' | 'ink' | 'sage';

export interface KpiCardProps {
  title: string;
  value: ReactNode;
  detail: ReactNode;
  icon: ReactNode;
  tone: KpiTone;
  loading?: boolean;
}

const INK = '#24262B';

const toneColors: Record<KpiTone, { bgcolor: string; color: string }> = {
  ochre: { bgcolor: '#D9A62E', color: INK },
  ink: { bgcolor: INK, color: '#F5F6F3' },
  sage: { bgcolor: '#9DB59F', color: INK },
};

export function KpiCard({ title, value, detail, icon, tone, loading = false }: KpiCardProps) {
  const titleId = useId();

  return (
    <Card
      role="group"
      aria-labelledby={titleId}
      aria-busy={loading}
      sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 1.5, minWidth: 0 }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
        <Typography
          id={titleId}
          component="h2"
          sx={{ fontSize: 13, fontWeight: 600, color: 'text.secondary' }}
        >
          {title}
        </Typography>
        <Box
          aria-hidden="true"
          sx={{
            ...toneColors[tone],
            width: 36,
            height: 36,
            flexShrink: 0,
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            '& svg': { fontSize: 18 },
          }}
        >
          {icon}
        </Box>
      </Box>
      {loading ? (
        <>
          <Skeleton variant="text" sx={{ fontSize: 32, width: '60%' }} />
          <Skeleton variant="text" sx={{ fontSize: 12, width: '80%' }} />
        </>
      ) : (
        <>
          <Typography
            sx={{
              fontSize: 32,
              fontWeight: 700,
              letterSpacing: '-0.5px',
              overflowWrap: 'anywhere',
            }}
          >
            {value}
          </Typography>
          <Box sx={{ fontSize: 12, color: 'text.secondary', alignSelf: 'flex-start' }}>
            {detail}
          </Box>
        </>
      )}
    </Card>
  );
}
