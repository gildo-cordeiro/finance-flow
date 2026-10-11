import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Sem `globals: true` no Vitest, o cleanup automático do Testing Library não roda sozinho.
afterEach(() => {
  cleanup();
});
