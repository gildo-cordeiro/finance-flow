import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { setAccessToken, setSessionExpiredHandler } from '@/services/http';

// O jsdom não implementa ResizeObserver, usado pelos componentes do Radix (shadcn)
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Sem `globals: true` no Vitest, o cleanup automático do Testing Library não roda sozinho.
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  setAccessToken(null);
  setSessionExpiredHandler(null);
});
