/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

// In iframe environments, Vite's HMR WebSocket can emit benign disconnection notices.
// Gracefully catch and ignore WebSocket/HMR errors so they don't disrupt the user experience.
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const msg = String(event.reason?.message || event.reason || '');
    const stack = String(event.reason?.stack || '');
    if (
      msg.includes('WebSocket') ||
      msg.includes('vite') ||
      stack.includes('@vite/client') ||
      stack.includes('vite/dist/client')
    ) {
      event.preventDefault();
    }
  });

  window.addEventListener('error', (event) => {
    const filename = String(event.filename || '');
    const msg = String(event.message || '');
    if (
      filename.includes('@vite/client') ||
      filename.includes('vite/dist/client') ||
      msg.includes('WebSocket')
    ) {
      event.preventDefault();
    }
  });
}

if (typeof window !== 'undefined') {
  (window as any).__TRUSTCHECK_MOUNTED__ = true;
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
