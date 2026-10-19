/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  apiUrl,
  getApiBaseUrl,
  DEFAULT_PRODUCTION_API_URL,
  isStaticHostingWithoutBackend,
} from './api.ts';

test('DEFAULT_PRODUCTION_API_URL targets Render production backend', () => {
  assert.equal(DEFAULT_PRODUCTION_API_URL, 'https://trust-check-hrw9.onrender.com');
});

test('apiUrl formats endpoints cleanly ensuring leading slash', () => {
  const url1 = apiUrl('/api/investigate');
  const url2 = apiUrl('api/investigate');
  assert.equal(url1, url2);
  assert.match(url1, /\/api\/investigate$/);
});

test('apiUrl preserves relative paths for same-origin full-stack deployment when no VITE_API_URL is set', () => {
  const base = getApiBaseUrl();
  // In Node test environment without browser window or VITE_API_URL, base is empty string
  assert.equal(base, '');
  assert.equal(apiUrl('/api/owner/status'), '/api/owner/status');
});

test('getApiBaseUrl routes to Render production backend on GitHub Pages', () => {
  const prevWindow = (global as any).window;
  (global as any).window = { location: { hostname: 'bhushankumar.github.io' } };
  try {
    assert.equal(getApiBaseUrl(), 'https://trust-check-hrw9.onrender.com');
    assert.equal(apiUrl('/api/investigate'), 'https://trust-check-hrw9.onrender.com/api/investigate');
    assert.equal(isStaticHostingWithoutBackend(), false);
  } finally {
    (global as any).window = prevWindow;
  }
});

test('getApiBaseUrl uses relative paths on same-origin full-stack preview (.run.app)', () => {
  const prevWindow = (global as any).window;
  (global as any).window = { location: { hostname: 'ais-dev-unmlw4teu5swvjek37tqps-245877593897.asia-southeast1.run.app' } };
  try {
    assert.equal(getApiBaseUrl(), '');
    assert.equal(apiUrl('/api/investigate'), '/api/investigate');
  } finally {
    (global as any).window = prevWindow;
  }
});

test('getApiBaseUrl uses relative paths when running directly on Render host', () => {
  const prevWindow = (global as any).window;
  (global as any).window = { location: { hostname: 'trust-check-hrw9.onrender.com' } };
  try {
    assert.equal(getApiBaseUrl(), '');
    assert.equal(apiUrl('/api/investigate'), '/api/investigate');
  } finally {
    (global as any).window = prevWindow;
  }
});
