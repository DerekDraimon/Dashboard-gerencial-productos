import CloseIcon from '@mui/icons-material/Close';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormHelperText from '@mui/material/FormHelperText';
import IconButton from '@mui/material/IconButton';
import OutlinedInput from '@mui/material/OutlinedInput';
import Stack from '@mui/material/Stack';
import { useId, useState, type KeyboardEvent } from 'react';

export const MAX_IMAGES = 10;

export interface ImageUrlsFieldProps {
  value: string[];
  onChange: (images: string[]) => void;
  error?: string;
}

type ImageStatus = 'loading' | 'ok' | 'error';

const STATUS_STYLES: Record<ImageStatus, { label: string; chip: object; row: object }> = {
  loading: {
    label: 'Cargando…',
    chip: { bgcolor: 'divider', color: 'text.primary' },
    row: { bgcolor: 'background.default', color: 'text.soft' },
  },
  ok: {
    label: 'OK',
    chip: { bgcolor: 'secondary.main', color: 'text.primary' },
    row: { bgcolor: 'background.default', color: 'text.soft' },
  },
  error: {
    label: 'No carga',
    chip: { bgcolor: 'background.paper', color: 'error.dark' },
    row: { bgcolor: 'tint.danger', color: 'error.dark' },
  },
};

function isHttpUrl(text: string): boolean {
  try {
    const { protocol } = new URL(text);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}

function addError(url: string, images: string[]): string | null {
  if (!isHttpUrl(url)) return 'Ingresa una URL válida (http o https).';
  if (images.includes(url)) return 'Esa imagen ya está agregada.';
  if (images.length >= MAX_IMAGES) return `Puedes agregar hasta ${MAX_IMAGES} imágenes.`;
  return null;
}

export function ImageUrlsField({ value, onChange, error }: ImageUrlsFieldProps) {
  const id = useId();
  const [draft, setDraft] = useState('');
  const [draftError, setDraftError] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<Record<string, ImageStatus>>({});
  const message = draftError ?? error;

  function add() {
    const url = draft.trim();
    const problem = addError(url, value);
    setDraftError(problem);
    if (problem) return;
    onChange([...value, url]);
    setDraft('');
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    add();
  }

  function markStatus(url: string, status: ImageStatus) {
    setStatuses((current) => ({ ...current, [url]: status }));
  }

  return (
    <Stack spacing={0.75}>
      <Box component="label" htmlFor={id} sx={{ fontSize: 13, fontWeight: 600 }}>
        URL de imagen
      </Box>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <OutlinedInput
          id={id}
          type="url"
          placeholder="https://…"
          value={draft}
          error={Boolean(message)}
          onChange={(event) => {
            setDraft(event.target.value);
            setDraftError(null);
          }}
          onKeyDown={handleKeyDown}
          inputProps={{ 'aria-describedby': message ? `${id}-error` : undefined }}
          sx={{ flex: 1, minWidth: 0 }}
        />
        <Button
          variant="outlined"
          onClick={add}
          sx={{ px: 2, color: 'text.primary', borderColor: 'text.primary' }}
        >
          Agregar
        </Button>
      </Box>
      {message && (
        <FormHelperText id={`${id}-error`} error sx={{ mx: 0 }}>
          {message}
        </FormHelperText>
      )}
      <Box
        component="ul"
        aria-label="Imágenes agregadas"
        sx={{
          listStyle: 'none',
          m: 0,
          mt: 0.75,
          p: 0,
          display: 'grid',
          // The implicit `auto` column grows to the full url width, so the ellipsis would never apply.
          gridTemplateColumns: 'minmax(0, 1fr)',
          gap: 0.75,
          fontSize: 13,
        }}
      >
        {value.map((url, index) => {
          const status = STATUS_STYLES[statuses[url] ?? 'loading'];
          // The API may return duplicate URLs, so the key counts earlier copies of the same URL.
          const copy = value.slice(0, index).filter((image) => image === url).length;
          return (
            <Box
              component="li"
              key={copy === 0 ? url : `${url}#${copy}`}
              sx={{
                ...status.row,
                display: 'flex',
                alignItems: 'center',
                gap: 1.25,
                py: 0.5,
                px: 1.25,
                borderRadius: '10px',
              }}
            >
              <img
                src={url}
                alt=""
                hidden
                onLoad={() => markStatus(url, 'ok')}
                onError={() => markStatus(url, 'error')}
              />
              <Box
                component="span"
                sx={{
                  ...status.chip,
                  px: 1,
                  py: 0.25,
                  borderRadius: '999px',
                  fontSize: 11,
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                }}
              >
                {status.label}
              </Box>
              <Box
                component="span"
                title={url}
                sx={{
                  flex: 1,
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {url}
              </Box>
              <IconButton
                aria-label={`Quitar imagen ${index + 1}`}
                onClick={() => onChange(value.filter((_, position) => position !== index))}
                sx={{ width: 32, height: 32, color: 'inherit' }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          );
        })}
      </Box>
    </Stack>
  );
}
