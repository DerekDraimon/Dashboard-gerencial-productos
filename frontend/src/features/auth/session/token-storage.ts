const TOKEN_KEY = 'dashboard-gerencial.token';

// Storage can throw (private mode, blocked site data); the session then lives only in memory.
export const tokenStorage = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string): void {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      // Ignored: see the note above.
    }
  },
  clear(): void {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // Ignored: see the note above.
    }
  },
};
