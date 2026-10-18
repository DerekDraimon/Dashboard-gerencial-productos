import { render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { TOKEN_KEY } from '../features/auth/session/token-storage';
import { httpClient } from '../shared/api/http-client';
import { App } from './App';
import { preloadPages } from '../test/preload-pages';

beforeAll(preloadPages);

afterEach(() => {
  localStorage.clear();
});

describe('App', () => {
  it('opens on the dashboard page for a signed-in user', async () => {
    localStorage.setItem(TOKEN_KEY, 'stored-token');
    httpClient.defaults.adapter = async (config) => ({
      status: 200,
      statusText: '',
      headers: {},
      config,
      data: { id: 'a1', email: 'ana@example.com', name: 'Ana', role: 'ADMIN', active: true },
    });
    render(<App />);

    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/dashboard');
  });
});
