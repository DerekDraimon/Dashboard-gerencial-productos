import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { httpClient } from '../shared/api/http-client';
import { App } from './App';

afterEach(() => {
  localStorage.clear();
});

describe('App', () => {
  it('opens on the dashboard page for a signed-in user', async () => {
    localStorage.setItem('dashboard-gerencial.token', 'stored-token');
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
