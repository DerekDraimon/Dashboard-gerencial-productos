import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

const EMPTY_DATE = '—';

// UTC keeps the shown day aligned with the backend, which filters by UTC days.
export function formatDate(iso: string): string {
  const date = dayjs.utc(iso);
  return iso && date.isValid() ? date.format('DD/MM/YYYY') : EMPTY_DATE;
}
