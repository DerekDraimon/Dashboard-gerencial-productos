import { HOME_PATH } from '../../../shared/layout/navigation';

function readString(source: object, key: string): string {
  const value: unknown = (source as Record<string, unknown>)[key];
  return typeof value === 'string' ? value : '';
}

// "//host" and "/\host" are protocol-relative for browsers, so they would leave the app.
function isSameAppPath(pathname: string): boolean {
  return pathname === '/' || /^\/[^/\\]/.test(pathname);
}

export function redirectTarget(state: unknown): string {
  if (typeof state !== 'object' || state === null || !('from' in state)) return HOME_PATH;
  const { from } = state;
  if (typeof from !== 'object' || from === null) return HOME_PATH;
  const pathname = readString(from, 'pathname');
  if (!isSameAppPath(pathname)) return HOME_PATH;
  return `${pathname}${readString(from, 'search')}${readString(from, 'hash')}`;
}
