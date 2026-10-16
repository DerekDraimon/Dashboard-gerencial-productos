import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { AppError } from '../src/shared/errors/app-error.js';
import { errorHandler } from '../src/shared/middlewares/error-handler.js';
import { notFoundHandler } from '../src/shared/middlewares/not-found.js';

/** Test-only app that mounts throwing routes on top of the shared error middlewares. */
function buildThrowingApp() {
  const app = express();
  app.get('/app-error', () => {
    throw new AppError(422, 'SOME_CODE', 'Something is not processable', [
      { path: 'field', message: 'bad' },
    ]);
  });
  app.get('/app-error-no-details', () => {
    throw new AppError(409, 'CONFLICT_CODE', 'Conflict happened');
  });
  app.get('/plain-error', () => {
    throw new Error('secret internal failure');
  });
  app.get('/async-error', async () => {
    await Promise.resolve();
    throw new Error('async secret failure');
  });
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

const internalError = {
  error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
};

describe('centralized error handling', () => {
  it('answers unknown routes with 404 NOT_FOUND in the standard shape', async () => {
    const res = await request(createApp()).get('/api/does-not-exist');

    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body).toEqual({
      error: { code: 'NOT_FOUND', message: 'Route GET /api/does-not-exist not found' },
    });
  });

  it('maps an AppError to its status, code, message and details', async () => {
    const res = await request(buildThrowingApp()).get('/app-error');

    expect(res.status).toBe(422);
    expect(res.body).toEqual({
      error: {
        code: 'SOME_CODE',
        message: 'Something is not processable',
        details: [{ path: 'field', message: 'bad' }],
      },
    });
  });

  it('omits details when an AppError has none', async () => {
    const res = await request(buildThrowingApp()).get('/app-error-no-details');

    expect(res.status).toBe(409);
    expect(res.body).toEqual({ error: { code: 'CONFLICT_CODE', message: 'Conflict happened' } });
  });

  it('maps an unexpected error to 500 INTERNAL_ERROR without leaking message or stack', async () => {
    const res = await request(buildThrowingApp()).get('/plain-error');

    expect(res.status).toBe(500);
    expect(res.body).toEqual(internalError);
    expect(res.text).not.toContain('secret internal failure');
    expect(res.text).not.toContain('stack');
  });

  it('catches errors thrown by async handlers', async () => {
    const res = await request(buildThrowingApp()).get('/async-error');

    expect(res.status).toBe(500);
    expect(res.body).toEqual(internalError);
  });

  it('answers a malformed JSON body with 400 INVALID_JSON', async () => {
    const res = await request(createApp())
      .post('/api/health')
      .set('Content-Type', 'application/json')
      .send('{"name": ');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: { code: 'INVALID_JSON', message: 'Request body contains malformed JSON' },
    });
  });
});
