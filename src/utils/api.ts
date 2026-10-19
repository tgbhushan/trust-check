/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const DEFAULT_PRODUCTION_API_URL = 'https://trust-check-hrw9.onrender.com';

/**
 * Retrieves the base URL for backend API queries.
 * In full-stack mode, this is an empty string (queries go to relative /api/*).
 * When frontend is deployed to GitHub Pages or a static host with a detached backend,
 * VITE_API_URL or VITE_API_BASE_URL provides the full backend origin.
 */
export function getApiBaseUrl(): string {
  try {
    // If the browser is running on a same-origin full-stack host (e.g. AI Studio preview, localhost, or the Render app itself),
    // always use relative paths (empty base) so requests stay on the local running Express instance.
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname.toLowerCase();
      const isSameOriginFullStack =
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname.endsWith('.run.app') ||
        hostname === 'trust-check-hrw9.onrender.com';

      if (isSameOriginFullStack) {
        return '';
      }
    }

    const envUrl =
      (import.meta as any).env?.VITE_API_URL ||
      (import.meta as any).env?.VITE_API_BASE_URL ||
      '';
    if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
      return envUrl.trim().replace(/\/+$/, '');
    }

    // When running in a browser on GitHub Pages or static hosts where VITE_API_URL
    // was not injected at build time, connect to the production Render backend.
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname.toLowerCase();
      if (hostname.endsWith('github.io') || hostname.endsWith('pages.dev')) {
        return DEFAULT_PRODUCTION_API_URL;
      }
    }
  } catch {
    // Ignore environment lookup failures
  }
  return '';
}

/**
 * Builds the complete API endpoint URL.
 */
export function apiUrl(endpoint: string): string {
  const base = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}${cleanEndpoint}`;
}

/**
 * Detects whether the frontend is running on a static hosting service (like GitHub Pages)
 * without a configured external backend URL.
 */
export function isStaticHostingWithoutBackend(): boolean {
  if (typeof window === 'undefined') return false;
  const hasConfiguredBackend = Boolean(getApiBaseUrl());
  if (hasConfiguredBackend) return false;

  const hostname = window.location.hostname.toLowerCase();
  return (
    hostname.endsWith('github.io') ||
    hostname.endsWith('pages.dev') ||
    hostname.endsWith('netlify.app') ||
    hostname.endsWith('vercel.app')
  );
}
