import AttachMoneyRounded from '@mui/icons-material/AttachMoneyRounded';
import CalendarMonthOutlined from '@mui/icons-material/CalendarMonthOutlined';
import EmojiEventsOutlined from '@mui/icons-material/EmojiEventsOutlined';
import ShowChartRounded from '@mui/icons-material/ShowChartRounded';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

const LIGHT = '#F5F6F3';
const MUTED_TEXT = '#C9CBCF';
const SAGE = '#9DB59F';
const OCHRE = '#D9A62E';
const GREY = '#5C5F66';

const HIGHLIGHTS = [
  { label: 'Valor del inventario exacto', Icon: AttachMoneyRounded },
  { label: 'Categoría líder al instante', Icon: EmojiEventsOutlined },
  { label: 'Filtros por fecha de creación', Icon: CalendarMonthOutlined },
  { label: 'Top 5 por precio', Icon: ShowChartRounded },
];

const CIRCLES = [
  { size: 420, bgcolor: OCHRE, right: -150, bottom: -170 },
  { size: 300, bgcolor: SAGE, right: 150, bottom: -210, opacity: 0.9 },
  { size: 230, border: '18px solid #3A3D43', right: -60, top: -70 },
  { size: 22, bgcolor: OCHRE, right: 210, top: 120 },
  { size: 12, bgcolor: SAGE, right: 120, top: 230 },
];

const DOT_GRID = Array.from({ length: 20 }, (_, index) => ({
  cx: 6 + (index % 5) * 24,
  cy: 6 + Math.floor(index / 5) * 24,
}));

function Shapes() {
  return (
    <Box
      aria-hidden="true"
      data-testid="login-shapes"
      sx={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
    >
      {CIRCLES.map(({ size, ...circle }, index) => (
        <Box
          key={index}
          sx={{
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: '50%',
            boxSizing: 'border-box',
            ...circle,
          }}
        />
      ))}
      <Box
        component="svg"
        viewBox="0 0 220 220"
        fill="none"
        sx={{ position: 'absolute', width: 220, height: 220, right: 60, top: 300 }}
      >
        <path d="M30 110a80 80 0 0 1 80-80" stroke={SAGE} strokeWidth="10" strokeLinecap="round" />
        <path d="M60 110a50 50 0 0 1 50-50" stroke={OCHRE} strokeWidth="10" strokeLinecap="round" />
        <path d="M190 110a80 80 0 0 1-80 80" stroke={GREY} strokeWidth="6" strokeLinecap="round" />
      </Box>
      <Box
        component="svg"
        viewBox="0 0 120 84"
        fill={GREY}
        sx={{ position: 'absolute', width: 120, height: 84, left: 48, bottom: 150 }}
      >
        {DOT_GRID.map(({ cx, cy }) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="3" />
        ))}
      </Box>
    </Box>
  );
}

function Logo() {
  return (
    <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: 1,
          bgcolor: 'primary.main',
          color: 'ink.main',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <ShowChartRounded sx={{ fontSize: 22 }} />
      </Box>
      <Typography sx={{ fontWeight: 700, fontSize: 17 }}>Gerencial</Typography>
    </Box>
  );
}

export interface LoginShowcaseProps {
  compact: boolean;
}

export function LoginShowcase({ compact }: LoginShowcaseProps) {
  return (
    <Box
      component="section"
      aria-label="Presentación"
      sx={{
        position: 'relative',
        overflow: 'hidden',
        bgcolor: 'ink.main',
        color: LIGHT,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        ...(compact ? { gap: 2, px: 2, py: 3 } : { flex: '1 1 0', minHeight: 520, gap: 5, p: 6 }),
      }}
    >
      {!compact && <Shapes />}
      <Logo />
      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          maxWidth: 440,
        }}
      >
        <Typography
          component="h2"
          sx={{ fontSize: compact ? 22 : 36, lineHeight: 1.15, fontWeight: 700 }}
        >
          Tu inventario, en orden y a la vista.
        </Typography>
        {!compact && (
          <Typography sx={{ fontSize: 15, lineHeight: 1.6, color: MUTED_TEXT }}>
            Consulta el valor del inventario, la categoría líder y los productos más recientes desde
            un solo panel.
          </Typography>
        )}
      </Box>
      {!compact && (
        <Box
          component="ul"
          aria-label="Lo que encuentras en el panel"
          sx={{
            position: 'relative',
            listStyle: 'none',
            m: 0,
            p: 0,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1,
            maxWidth: 460,
          }}
        >
          {HIGHLIGHTS.map(({ label, Icon }) => (
            <Box
              component="li"
              key={label}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 1.75,
                py: 1,
                borderRadius: 999,
                bgcolor: LIGHT,
                color: 'ink.main',
                fontSize: 13,
                fontWeight: 600,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
              }}
            >
              <Icon aria-hidden="true" sx={{ fontSize: 16 }} />
              {label}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
